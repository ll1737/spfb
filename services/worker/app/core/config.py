import os
from pathlib import Path
from pydantic import BaseModel


def load_app_secret() -> str:
    explicit_secret = os.getenv("APP_SECRET", "").strip()
    if explicit_secret:
        return explicit_secret

    secret_path = Path(__file__).resolve().parents[4] / "data" / ".app-secret"
    secret_path.parent.mkdir(parents=True, exist_ok=True)
    if secret_path.exists():
        persisted_secret = secret_path.read_text(encoding="utf-8").strip()
        if persisted_secret:
            return persisted_secret

    import secrets
    generated_secret = secrets.token_hex(32)
    secret_path.write_text(generated_secret, encoding="utf-8")
    return generated_secret


def load_worker_api_key() -> str:
    explicit_key = os.getenv("WORKER_API_KEY", "").strip()
    if explicit_key:
        return explicit_key

    key_path = Path(__file__).resolve().parents[4] / "data" / ".worker-api-key"
    key_path.parent.mkdir(parents=True, exist_ok=True)
    if key_path.exists():
        persisted_key = key_path.read_text(encoding="utf-8").strip()
        if persisted_key:
            return persisted_key

    import secrets
    generated_key = secrets.token_hex(32)
    key_path.write_text(generated_key, encoding="utf-8")
    return generated_key

class WorkerConfig(BaseModel):
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    WORKER_API_KEY: str = load_worker_api_key()
    APP_SECRET: str = load_app_secret()
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"
    DEFAULT_TIMEOUT_MS: int = int(os.getenv("DEFAULT_TIMEOUT_MS", "30000"))
    SCREENSHOT_DIR: str = os.getenv("SCREENSHOT_DIR", "debug_snapshots")

config = WorkerConfig()
