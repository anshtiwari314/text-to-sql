from flask import Blueprint, jsonify

from core.config import OPENROUTER_MODEL

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """Quick check that Flask itself is running: GET /api/health"""
    return jsonify({"status": "ok", "model": OPENROUTER_MODEL})
