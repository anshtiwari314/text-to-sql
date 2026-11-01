from flask import Blueprint, request, jsonify
from llm_service import generate_sql_or_clarify
from db_service import execute_generated_sql

api_bp = Blueprint('api', __name__)

@api_bp.route('/fullfill_query', methods=['POST'])
def fullfill_query():
    try:
        data = request.json
        prompt = data.get('prompt')
        schema = data.get('schema') # Next.js sends the cached JSON schema
        history = data.get('history', []) # Array of past messages
        credentials = data.get('credentials') # Target DB connection details

        if not prompt or not credentials:
            return jsonify({"error": "Prompt and credentials are required"}), 400

        # Step 1: Let LangChain process the request
        agent_response = generate_sql_or_clarify(prompt, schema, history)

        # Step 2: Handle Clarification
        if agent_response.status == 'clarification':
            return jsonify({
                "type": "clarification",
                "message": agent_response.content,
                "sql_string": None,
                "rows": None
            }), 200

        # Step 3: Handle SQL Generation and Execution
        if agent_response.status == 'sql':
            sql_string = agent_response.content
            
            try:
                # Instantly execute the SQL against the user's DB
                rows = execute_generated_sql(sql_string, credentials)
                
                return jsonify({
                    "type": "success",
                    "message": "Here is your generated query and data.",
                    "sql_string": sql_string,
                    "rows": rows
                }), 200
                
            except Exception as db_err:
                # If the SQL fails to run (e.g., bad syntax from LLM)
                return jsonify({
                    "type": "error",
                    "message": f"Generated SQL failed to execute: {str(db_err)}",
                    "sql_string": sql_string,
                    "rows": None
                }), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500