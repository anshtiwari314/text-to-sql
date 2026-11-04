"""
STEP 2 of the flow: the user asks a question in the chat.

POST /api/fullfill_query
  body: {
    prompt:      "which 5 customers ordered the most?",
    schema:      "<schema text from /api/schema>",
    history:     [ last 4 chat messages ],
    credentials: { engine, host, port, db_name, db_username, db_password }
  }

Response is always ONE of these:
  { type: "success",       message, sql, columns, rows }
  { type: "clarification", message (the question), sql: null, rows: [] }
  { type: "error",         message, sql }   <- SQL ran but failed

Errors are turned into JSON by routes/errors.py.
"""

from flask import Blueprint, jsonify, request

from services.chat_service import fullfill_query

query_bp = Blueprint("query", __name__)


@query_bp.post("/fullfill_query")
def fullfill_query_route():
    return jsonify(fullfill_query(request.get_json(silent=True) or {}))
