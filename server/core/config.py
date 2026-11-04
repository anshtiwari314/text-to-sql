"""
All settings in ONE place, read from server/.env (not the shell cwd).

To change the LLM model, just change OPENROUTER_MODEL in .env - no code edit.
"""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# core/config.py -> server/.env (always the same path even if you run from repo root)
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

# ---- LLM (OpenRouter speaks the OpenAI API, so we use langchain-openai) ----
OPENROUTER_API_KEY = (os.getenv("OPENROUTER_API_KEY") or "").strip()
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

if not OPENROUTER_API_KEY:
    logger.warning(
        "OPENROUTER_API_KEY is empty after loading %s — use KEY=value with no extra quotes (not \"\"key\"\")",
        _ENV_PATH,
    )

# ---- How many old chat messages we send back to the LLM ----
HISTORY_LIMIT = int(os.getenv("HISTORY_LIMIT", "4"))

# ---- Safety limits ----
MAX_ROWS = int(os.getenv("MAX_ROWS", "200"))          # never return more rows than this
QUERY_TIMEOUT_MS = int(os.getenv("QUERY_TIMEOUT_MS", "15000"))  # a query can't run longer than this

# ---- CORS: which websites may call this Flask API ----
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
