from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import BaseModel, Field

# 1. Define the exact structure we want the LLM to return
class AgentResponse(BaseModel):
    status: str = Field(description="'sql' if you can confidently generate a query, 'clarification' if the user's request is ambiguous or missing details.")
    content: str = Field(description="The generated SQL query, OR the clarifying question to ask the user.")

def generate_sql_or_clarify(prompt: str, schema: str, history: list):
    # Initialize the LLM (ensure OPENAI_API_KEY is in your .env)
    llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)
    
    # Bind the Pydantic model to force JSON output
    structured_llm = llm.with_structured_output(AgentResponse)

    # 2. Create the Prompt Template with System Instructions
    system_prompt = """You are an expert SQL assistant. Your job is to convert natural language into SQL.
    You have access to the following database schema:
    {schema}
    
    Instructions:
    1. If the user's request is clear, generate the raw SQL query.
    2. If the request is ambiguous, confusing, or asks for columns that do not exist in the schema, ASK FOR CLARIFICATION.
    3. Do NOT invent tables or columns that are not in the schema.
    4. Only output Postgres-compatible SQL (unless otherwise specified).
    """

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])

    # 3. Format the chat history (limiting to the last 4 messages)
    formatted_history = []
    # Take only the last 4 messages to prevent context overflow
    recent_history = history[-4:] if len(history) > 4 else history
    
    for msg in recent_history:
        if msg.get('role') == 'user':
            formatted_history.append(HumanMessage(content=msg.get('content')))
        elif msg.get('role') == 'ai':
            # Store previous SQL or text responses as AI memory
            formatted_history.append(AIMessage(content=msg.get('content')))

    # 4. Execute the chain
    chain = prompt_template | structured_llm
    
    result = chain.invoke({
        "schema": schema,
        "chat_history": formatted_history,
        "input": prompt
    })

    return result