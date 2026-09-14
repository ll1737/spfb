import os
from pydantic import BaseModel

class WorkerConfig(BaseModel):
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    WORKER_API_KEY: str = os.getenv("WORKER_API_KEY", "secret_worker_token_2026")
    APP_SECRET: str = os.getenv("APP_SECRET", "multi_publish_secret_key_2026")
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"
    DEFAULT_TIMEOUT_MS: int = int(os.getenv("DEFAULT_TIMEOUT_MS", "30000"))
    SCREENSHOT_DIR: str = os.getenv("SCREENSHOT_DIR", "debug_snapshots")

config = WorkerConfig()
