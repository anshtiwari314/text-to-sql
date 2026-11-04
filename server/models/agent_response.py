"""
The exact shape we want the LLM to answer with.

LangChain uses this class to force the LLM into a structured answer
(no markdown, no extra text - just these fields).
"""

from pydantic import BaseModel, Field


class AgentResponse(BaseModel):
    needs_clarification: bool = Field(
        description=(
            "true ONLY when the question is ambiguous, or it asks for tables/columns "
            "that are not in the schema. false when you are confident."
        )
    )
    question: str = Field(
        default="",
        description="If needs_clarification is true: the short question to ask the user. Otherwise empty.",
    )
    sql: str = Field(
        default="",
        description="If needs_clarification is false: ONE raw SQL query, no markdown, no explanation.",
    )
