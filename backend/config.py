from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    LEMON_SQUEEZY_API_KEY: str = ""
    LEMON_SQUEEZY_WEBHOOK_SECRET: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    RESEND_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    INSFORGE_API_KEY: str = ""
    INSFORGE_PROJECT_ID: str = ""
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
