"""
Flask entry point. Run it with:   python app.py

This file only wires things together - the real logic is in:
  core/       settings + which database engines we support
  models/     the shape the LLM must answer in
  services/   database, LLM and chat logic
  routes/     the HTTP endpoints
"""

from flask import Flask
from flask_cors import CORS

from core.config import CORS_ORIGINS
from routes.errors import register_error_handlers
from routes.health_routes import health_bp
from routes.query_routes import query_bp
from routes.schema_routes import schema_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(schema_bp, url_prefix="/api")
    app.register_blueprint(query_bp, url_prefix="/api")

    register_error_handlers(app)
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
