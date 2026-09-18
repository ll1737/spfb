import os
from pathlib import Path
from pydantic import BaseModel


def load_app_secret() -> str:
    explicit_secret = os.getenv("APP_SECRET", "").strip()
    if explicit_secret:
        return explicit_secret

    secret_path = Path(__file__).resolve().parents[4] / "data" / ".app-secret"
    if secret_path.exists():
        persisted_secret = secret_path.read_text(encoding="utf-8").strip()
        if persisted_secret:
            return persisted_secret

    return "zhiyu_matrix_app_secret_super_secure_2026"


def load_worker_api_key() -> str:
    explicit_key = os.getenv("WORKER_API_KEY", "").strip()
    if explicit_key:
        return explicit_key

    key_path = Path(__file__).resolve().parents[4] / "data" / ".worker-api-key"
    if key_path.exists():
        persisted_key = key_path.read_text(encoding="utf-8").strip()
        if persisted_key:
            return persisted_key

    return "secret_worker_token_2026"


class WorkerConfig(BaseModel):
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    WORKER_API_KEY: str = load_worker_api_key()
    APP_SECRET: str = load_app_secret()
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"
    DEFAULT_TIMEOUT_MS: int = int(os.getenv("DEFAULT_TIMEOUT_MS", "30000"))
    SCREENSHOT_DIR: str = os.getenv("SCREENSHOT_DIR", "debug_snapshots")

config = WorkerConfig()
