# Test cases log

## TC-ENV-001 — OpenRouter key in server/.env
- **Given** `server/.env` has `OPENROUTER_API_KEY` set
- **When** Flask handles `/api/fullfill_query`
- **Then** no "OPENROUTER_API_KEY is missing" error; LLM call proceeds
- **Note** Value must be `KEY=sk-or-...` without extra `"` wrapping (`""key""` breaks dotenv)

## TC-CHAT-001 — Generate without "Select & load schema"
- **Given** at least one DB in Postgres and one id in header "Query scope"
- **When** user sends a prompt in Chat
- **Then** response includes `sql`, `columns`, and `rows` (or clarification message)

## TC-SCHEMA-W3 — W3Schools customers.Country reaches LLM
- **Given** a DB shaped like W3Schools (table `customers` with column `Country`)
- **When** Flask runs `fetch_schema` then `/api/fullfill_query` for "customers per country"
- **Then** schema text includes `Country`; LLM system prompt includes CREATE TABLE DDL; response is SQL + rows
- **Automated**: `server/tests/test_w3schools_schema.py` (SQLite + **fake** LLM — not your remote MySQL)
- **Parity reference**: `~/Desktop/practise-and-make/Ai-course/3-text-to-sql/agent.py` (MySQL `w3schools`, DDL reflect, JSON sql)

## TC-AGENT-PARITY — Match course agent.py
- **Schema**: SQLAlchemy `MetaData.reflect` + `CREATE TABLE` DDL (not column list only)
- **LLM**: OpenRouter + JSON `{ "sql", "explanation" }` (not structured clarification)
- **MySQL W3Schools**: PascalCase table names (`Customers`, `Country`) + casing fix before execute
- **Saved connection in app**: engine **MySQL**, database **w3schools**, same host/port as agent.py

## TC-JSON-001 — Model reply is not strict JSON
- **When** the model wraps JSON in markdown, adds text, or returns a bare SELECT
- **Then** Flask still extracts `sql` and runs it
- **Prompt** matches `agent.py` (MySQL/dialect rules + CREATE TABLE schema + JSON keys `sql` and `explanation`)
