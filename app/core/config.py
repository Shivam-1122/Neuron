from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neuron AI Memory Assistant"
    API_V1_STR: str = "/api/v1"
    
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_MODE: str = "server" # 'local' or 'server'
    QDRANT_PATH: str = "qdrant_storage"
    
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "groq"

    def get_qdrant_url(self) -> str:
        if self.QDRANT_URL:
            return self.QDRANT_URL
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
