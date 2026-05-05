from langchain_openai import ChatOpenAI
import os

def get_llm(settings: dict = None):
    # Dynamic LLM Configuration
    if settings is None:
        settings = {}
        
    api_key = settings.get("apiKey") or os.getenv("OPENAI_API_KEY", "dummy-key-for-local")
    base_url = settings.get("baseUrl") or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model = settings.get("defaultModel") or "gpt-4o-mini"
    
    return ChatOpenAI(
        model=model,
        temperature=0.7,
        api_key=api_key,
        base_url=base_url
    )
