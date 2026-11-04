# Text-to-SQL app - how the whole thing fits together

Two apps:

- **`client/`** - Next.js UI + auth + the app's own Postgres database (users, saved databases, chat history)
- **`server/`** - Flask + LangChain, does the text-to-SQL work against **the user's** database

The backend guide (file-by-file) is in [server/README.md](server/README.md).

---

## The two steps

### Step 1 - selecting a database = "test the connection + load the schema"

```
DatabaseList.tsx  ──click──►  TextToSqlApp.handleSelectDatabase()
        │
        ▼
POST /api/schema                     (Next.js: app/api/schema/route.ts)
        │  reads host/port/user/password from saved_databases (only for this user)
        ▼
POST /api/schema                     (Flask: routes/schema_routes.py)
        │  services/db_service.fetch_schema() -> connects, runs SELECT 1, lists tables/columns
        ▼
{ connected: true, schema: "Table \"users\" ..." }
        │
        ▼
Redux: setSchema({ dbId, schema })   (store/appSlice.ts)   → also sets activeDbId
```

You stay on the Data Sources page after loading (so the connection can still be edited).
`activeDbId` - not the header's `selectedDbIds` filter - is what the chat talks to.

If the connection fails, the card shows the error and **no schema is saved** - the chat refuses to run
until a database is connected.

### Step 2 - chatting = "SQL + data, or a clarifying question"

```
ChatView.handleGenerate()
        │  body: { prompt, databaseId, schema, history: messages.slice(-4) }
        ▼
POST /api/fullfill_query             (Next.js: app/api/fullfill_query/route.ts)
        │  1. loads credentials for databaseId
        │  2. forwards to Flask
        │  3. saves prompt + generated SQL into chat_histories
        ▼
POST /api/fullfill_query             (Flask: routes/query_routes.py)
        │  services/chat_service.fullfill_query()
        │     LangChain: system prompt(schema + dialect) + last 4 messages + question
        │     LLM (OpenRouter) answers with AgentResponse:
        │        needs_clarification = true  -> return the question to the user
        │        needs_clarification = false -> run_sql() on the user's DB
        ▼
{ type: "success" | "clarification" | "error", message, sql, columns, rows }
        │
        ▼
ChatView adds an AI bubble: the message, the SQL block, and the data table (ResultTable.tsx)
```

---

## Files touched for this feature

### server/ (new structure)

| file                          | job                                              |
| ----------------------------- | ------------------------------------------------ |
| `app.py`                      | create Flask app, register blueprints            |
| `core/config.py`              | env settings (OpenRouter key/model, limits)      |
| `core/engines.py`             | engine name from the UI -> driver, URL, SQL dialect |
| `models/agent_response.py`    | the structured shape the LLM must return         |
| `services/db_service.py`      | connect, fetch schema, run SELECT-only SQL       |
| `services/llm_service.py`     | LangChain prompt + chat history + OpenRouter     |
| `services/chat_service.py`    | clarify-vs-generate decision and execution       |
| `routes/*.py`                 | `fullfill_query`, `schema`, `health`, errors     |
| `tests/test_flow.py`          | offline end-to-end test with a fake LLM          |

### client/

| file                                       | change                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| `app/api/schema/route.ts`                  | **new** - verifies the DB and returns the schema              |
| `app/api/fullfill_query/route.ts`          | **new** - replaces `app/api/chat/route.ts`; sends schema + last 4 messages, saves history |
| `lib/flask.ts`                             | **new** - shared Flask caller + `HISTORY_LIMIT`               |
| `types/index.ts`                           | **new** types: `ChatMessage`, `QueryResult`, `DbCredentials`  |
| `store/appSlice.ts`                        | `activeDbId`, schema cache, and `messages` in Redux           |
| `components/DatabaseList.tsx`              | "Select & load schema" + a Configure gear; shows loading / connected / error |
| `components/TextToSqlApp.tsx`              | `handleSelectDatabase()` calls `/api/schema`, then opens chat |
| `components/ChatView.tsx`                  | sends schema + last 4 messages, renders rows + clarifications |
| `components/ResultTable.tsx`               | **new** - table for the returned rows                         |
| `components/DatabaseDetails.tsx`           | **rewritten** - editable connection form (Save keeps you on the page) |
| `app/api/databases/[id]/route.ts`          | **new** - `PUT` to update a connection; empty password keeps the old one |
| `app/api/databases/route.ts`               | restored `conn_name` / `read_only` (the real column names - see note below) |

`app/api/chat/route.ts` was removed - `fullfill_query` does the same job plus the schema and history.

---

## Running everything

```bash
# terminal 1 - Flask
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # add OPENROUTER_API_KEY
python app.py             # http://127.0.0.1:8000

# terminal 2 - Next.js
cd client
npm install
npm run dev               # http://localhost:3000
```

`client/.env.local` needs:

```
DATABASE_URL=postgres://user:pass@localhost:5432/sql_app   # the app's own DB
FLASK_URL=http://127.0.0.1:8000
```

## Things to know

- **Engine support:** PostgreSQL, MySQL and SQL Server work through SQLAlchemy. SQLite is supported by
  the backend, but the UI's connect form asks for host/port, so a SQLite file path can't be entered
  there yet - add a path field if you need it.
- **API key never reaches the browser:** only Flask holds `OPENROUTER_API_KEY`; Next.js only forwards
  the user's DB credentials.
- **Read-only:** only `SELECT` / `WITH ... SELECT` is executed, and results are capped by `MAX_ROWS`.

## Column names: the DB is the source of truth

`prisma/schema.prisma` and the database have drifted apart. The **real** tables are:

| table             | columns                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `saved_databases` | `id, user_id, conn_name, engine, host, port, db_username, db_password, db_name, read_only` |
| `chat_histories`  | `id, user_id, database_id, prompt, generated_sql, created_at`                            |
| `users`           | `id, name, email, image, last_login`                                                     |

...but `schema.prisma` still says `name` and has no `read_only`, so Prisma's types and the app's SQL
disagree. Always write SQL against the real columns (`conn_name`, `read_only`).

To make them agree later, either rename the DB column:

```sql
ALTER TABLE saved_databases RENAME COLUMN conn_name TO name;
ALTER TABLE saved_databases ADD COLUMN read_only BOOLEAN NOT NULL DEFAULT false;
```

...or update `schema.prisma` to match the DB. Until then, `prisma migrate` would try to drop
`conn_name` - avoid running it.
