# Server (Flask + LangChain)

Turns a plain-English question into SQL, runs it on **the user's own database**, and returns the SQL + the data.

---

## 1. The big picture

```
Browser (Next.js)
   │
   │  STEP 1 - user clicks a database in the list
   ▼
Next.js  POST /api/schema   ──────────►  Flask  POST /api/schema
   │   (loads credentials from Postgres)      (connects to user's DB, reads tables/columns)
   │  ◄──────────────────────────────────────────────  { connected: true, schema: "Table ..." }
   ▼
Browser keeps the schema text in Redux
   │
   │  STEP 2 - user types a question
   ▼
Next.js  POST /api/fullfill_query  ───►  Flask  POST /api/fullfill_query
   │    { prompt, schema, history: last 4 messages, credentials }
   │                                          │
   │                                          ├─ 1. LangChain prompt = schema + old messages + question
   │                                          ├─ 2. LLM (OpenRouter) decides:
   │                                          │      • not sure  -> ask a question back
   │                                          │      • confident -> write SQL
   │                                          ├─ 3. run the SQL on the user's DB (SELECT only)
   │                                          └─ 4. return { type, message, sql, rows }
   │  ◄──────────────────────────────────────────────────────────────
   └─ saves prompt + SQL in chat_histories, shows SQL + table in the chat
```

Only **two** endpoints touch the database, and both live in Flask. Next.js just passes credentials along.

---

## 2. Files (each file has one job)

```
server/
├── app.py                    ← entry point: creates Flask, registers routes. Run this.
├── requirements.txt
├── .env.example              ← copy to .env and fill in keys
│
├── core/
│   ├── config.py             ← every setting (OpenRouter key/model, limits) from .env
│   └── engines.py            ← PostgreSQL / MySQL / SQL Server / SQLite -> driver + URL + SQL dialect
│
├── models/
│   └── agent_response.py     ← the exact shape the LLM must answer in
│
├── services/
│   ├── db_service.py         ← connect to the user's DB, read schema, run SQL (SELECT-only guard)
│   ├── llm_service.py        ← LangChain: prompt template + last 4 messages -> LLM -> AgentResponse
│   └── chat_service.py       ← the "brain": LLM -> clarify OR (generate SQL -> run it -> return rows)
│
├── routes/
│   ├── query_routes.py       ← POST /api/fullfill_query   (STEP 2)
│   ├── schema_routes.py      ← POST /api/schema           (STEP 1: is the DB connected?)
│   ├── health_routes.py      ← GET  /api/health
│   └── errors.py             ← turns Python errors into clean JSON + right status code
│
└── tests/
    └── test_flow.py          ← offline test, no API key needed
```

**Where to change what**

| I want to...                              | Edit                         |
| ----------------------------------------- | ---------------------------- |
| change the model                          | `.env` → `OPENROUTER_MODEL`  |
| change how the LLM is told to behave      | `services/llm_service.py`    |
| remember more/less chat                   | `.env` → `HISTORY_LIMIT`     |
| support another database engine           | `core/engines.py`            |
| change the JSON the LLM returns           | `models/agent_response.py`   |
| add a new endpoint                        | a new file in `routes/`      |

---

## 3. Run it

```bash
cd server

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then put your OPENROUTER_API_KEY in .env

python app.py                      # http://127.0.0.1:8000
```

Quick checks:

```bash
curl http://127.0.0.1:8000/api/health
python tests/test_flow.py          # full flow with a fake LLM (no key needed)
```

The Next.js app must point at Flask: in `client/.env.local` add `FLASK_URL=http://127.0.0.1:8000`.

---

## 4. The request / response bodies

### `POST /api/schema` - "can we connect to this database?"

```json
{ "credentials": { "engine": "PostgreSQL", "host": "localhost", "port": 5432,
                   "db_name": "shop", "db_username": "postgres", "db_password": "..." } }
```

```json
{ "connected": true, "engine": "postgresql", "dialect": "PostgreSQL",
  "schema": "Table \"customers\"\n  - id (uuid, primary key)\n  - name (varchar(255))\n" }
```

If the connection fails you get `502` with `{ "error": "Could not connect to the database: ..." }`.

### `POST /api/fullfill_query` - "answer this question"

```json
{ "prompt": "who spent the most?",
  "schema": "<the schema text from /api/schema>",
  "history": [ { "role": "user", "content": "..." },
               { "role": "ai",   "content": "...", "sql": "SELECT ..." } ],
  "credentials": { "engine": "PostgreSQL", "...": "..." } }
```

Always one of three replies:

```json
// the LLM was confident -> SQL + rows
{ "type": "success", "message": "Found 2 row(s)", "sql": "SELECT ...", "columns": ["name","total"],
  "rows": [ { "name": "Ben", "total": 99.9 } ], "truncated": false }

// the question was unclear -> ask the user instead of guessing
{ "type": "clarification", "message": "Do you mean the total amount, or the number of orders?",
  "sql": null, "columns": [], "rows": [] }

// the SQL didn't run (wrong column, permissions, ...) - the SQL is still returned
{ "type": "error", "message": "SQL failed to run: ...", "sql": "SELECT ...", "columns": [], "rows": [] }
```

---

## 5. Why the schema is fetched separately

- **Step 1 proves the connection works** before the user starts chatting. A broken password is reported on the database card, not in the middle of a conversation.
- **Step 2 sends the schema back** so the chat route doesn't need to re-read the user's database schema on every message (faster, fewer connections).
- If a request arrives without a schema (e.g. calling Flask directly), `chat_service.py` fetches it on the fly, so nothing breaks.

## 6. Conversation memory

`client/lib/flask.ts` and `server/core/config.py` both use `HISTORY_LIMIT = 4`.

The browser sends the last 4 messages; `llm_service.build_chat_history()` turns them into
LangChain `HumanMessage` / `AIMessage` objects. The SQL from earlier answers is included too, so
follow-ups like *"now only the last 30 days"* work.

## 7. Safety

- Only single `SELECT` / `WITH ... SELECT` statements run (`db_service.is_read_only`).
- A `LIMIT` is added when missing, and at most `MAX_ROWS` rows are returned.
- PostgreSQL gets a `statement_timeout` so one slow query can't hang the server.
