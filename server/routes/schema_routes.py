"""
STEP 1 of the flow: the user selects a database in the UI.

POST /api/schema
  body: { credentials: { engine, host, port, db_name, db_username, db_password } }
  -> connects to the user's DB, tests the connection, returns the schema TEXT.

The browser keeps this text. Step 2 (chat) sends it back, so we don't
connect to the user's DB just to read the schema on every single message.
"""

from flask import Blueprint, jsonify, request

from core.engines import get_credentials
from services.db_service import fetch_schema

schema_bp = Blueprint("schema", __name__)


@schema_bp.post("/schema")
def get_schema():
    payload = request.get_json(silent=True) or {}
    conn = get_credentials(payload)

    return jsonify({
        "connected": True,
        "engine": conn["engine"],
        "dialect": conn["dialect"],
        "schema": fetch_schema(conn),
    })
