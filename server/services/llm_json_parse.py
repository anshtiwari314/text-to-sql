"""Parse LLM answers the same way as Ai-course/3-text-to-sql/agent.py, plus fallbacks."""

import json
import logging
import re

logger = logging.getLogger(__name__)


def message_text(content):
    """Chat models sometimes return a string, sometimes a list of text blocks."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text") or block.get("content") or ""))
            else:
                parts.append(str(getattr(block, "text", "") or ""))
        return "\n".join(parts)
    return str(content)


def _load_object(text):
    data = json.loads(text)
    if not isinstance(data, dict):
        return None
    if "sql" not in data and "SQL" in data:
        data["sql"] = data["SQL"]
    if "sql" not in data and "query" in data:
        data["sql"] = data["query"]
    if "sql" not in data:
        return None
    data.setdefault("explanation", data.get("message") or "")
    return data


def parse_llm_json(raw_text):
    text = (raw_text or "").strip()
    if not text:
        return None

    candidates = []
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        candidates.append(fenced.group(1).strip())
    candidates.append(text)
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        candidates.append(text[start : end + 1])

    for clean in candidates:
        try:
            parsed = _load_object(clean)
        except json.JSONDecodeError:
            continue
        if parsed is not None:
            return parsed

    sql_match = re.search(r'"sql"\s*:\s*"((?:\\.|[^"\\])*)"', text, re.DOTALL | re.IGNORECASE)
    if sql_match:
        try:
            sql = json.loads('"' + sql_match.group(1) + '"')
        except json.JSONDecodeError:
            sql = sql_match.group(1)
        explanation = ""
        exp_match = re.search(
            r'"explanation"\s*:\s*"((?:\\.|[^"\\])*)"', text, re.DOTALL | re.IGNORECASE
        )
        if exp_match:
            try:
                explanation = json.loads('"' + exp_match.group(1) + '"')
            except json.JSONDecodeError:
                explanation = exp_match.group(1)
        logger.info("llm_json_parse: recovered sql via regex")
        return {"sql": sql, "explanation": explanation}

    select_match = re.search(r"(SELECT\b[\s\S]+)", text, re.IGNORECASE)
    if select_match:
        sql = select_match.group(1).strip()
        sql = sql.split("```")[0].strip().rstrip(";").strip()
        logger.info("llm_json_parse: recovered bare SELECT")
        return {"sql": sql, "explanation": "SQL extracted from the model reply."}

    return None
