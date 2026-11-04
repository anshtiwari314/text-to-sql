"""
One place that turns Python exceptions into clean JSON errors,
so every route doesn't need its own try/except.
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException

from core.engines import UnsupportedEngineError


def register_error_handlers(app):
    @app.errorhandler(ValueError)
    @app.errorhandler(UnsupportedEngineError)
    def bad_request(error):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(ConnectionError)
    def db_down(error):
        return jsonify({"error": str(error)}), 502  # bad gateway: the user's DB is unreachable

    @app.errorhandler(RuntimeError)
    def missing_config(error):
        return jsonify({"error": str(error)}), 500  # e.g. missing OPENROUTER_API_KEY

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify({"error": error.description}), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.exception("Unexpected error")
        return jsonify({"error": f"Something went wrong: {error}"}), 500
