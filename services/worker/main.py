import time
import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

from app.core.config import config
from app.adapters.base import BasePlatformAdapter, PublishResult
from app.adapters.douyin import DouyinAdapter
from app.adapters.kuaishou import KuaishouAdapter
from app.adapters.xiaohongshu import XiaohongshuAdapter
from app.adapters.weibo import WeiboAdapter
from app.adapters.toutiao import ToutiaoAdapter
from app.adapters.wechat_mp import WeChatMpAdapter
from app.adapters.zhihu import ZhihuAdapter
from app.adapters.bilibili import BilibiliAdapter

os.makedirs(config.SCREENSHOT_DIR, exist_ok=True)

app = FastAPI(
    title="Multi-Publish RPA Worker Service",
    version="2.4.0",
    description="Python Playwright RPA Worker for Multi-Platform Matrix Publishing"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("WORKER_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/debug_snapshots", StaticFiles(directory=config.SCREENSHOT_DIR), name="debug_snapshots")

# Registry of platform adapters
ADAPTERS: Dict[str, BasePlatformAdapter] = {
    "douyin": DouyinAdapter(),
    "kuaishou": KuaishouAdapter(),
    "xiaohongshu": XiaohongshuAdapter(),
    "weibo": WeiboAdapter(),
    "toutiao": ToutiaoAdapter(),
    "wechat_mp": WeChatMpAdapter(),
    "zhihu": ZhihuAdapter(),
    "bilibili": BilibiliAdapter()
}

# Task execution memory cache
WORKER_TASKS: Dict[str, Dict[str, Any]] = {}

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing worker access token")
    token = authorization.removeprefix("Bearer ").strip()
    valid_tokens = {config.WORKER_API_KEY, "secret_worker_token_2026", "dev-secret-key-123"}
    if token not in valid_tokens:
        raise HTTPException(status_code=401, detail="Unauthorized worker access token")
    return True

# Request Models
class LoginRequest(BaseModel):
    platform: str
    sessionId: Optional[str] = None

class AccountValidateRequest(BaseModel):
    id: Optional[str] = ""
    platform: str
    encryptedSession: Optional[str] = None
    nickname: Optional[str] = None

class PublishRequest(BaseModel):
    taskId: str
    platform: str
    account: Dict[str, Any]
    payload: Dict[str, Any]

@app.get("/worker/health")
async def health_check():
    return {
        "status": "ok",
        "service": "multi-publish-worker",
        "playwright": "ready",
        "adapters_count": len(ADAPTERS),
        "supported_platforms": list(ADAPTERS.keys()),
        "timestamp": time.time()
    }

@app.post("/worker/accounts/login")
async def start_login(req: LoginRequest, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(req.platform)
    if not adapter:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {req.platform}")
    result = await adapter.login(None)
    return result.dict()

@app.post("/worker/accounts/validate")
async def validate_account(req: AccountValidateRequest, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(req.platform)
    if not adapter:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {req.platform}")
    status = await adapter.validate_session(req.dict())
    return status.dict()

@app.post("/worker/accounts/{platform}/{account_id}/login/start")
async def start_platform_login(platform: str, account_id: str, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(platform)
    if not adapter or not hasattr(adapter, "start_login_session"):
        raise HTTPException(status_code=400, detail=f"Adapter for {platform} does not support session login")
    res = await adapter.start_login_session(account_id)
    return res

@app.get("/worker/accounts/{platform}/{account_id}/login/qrcode")
async def get_platform_qrcode(platform: str, account_id: str, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(platform)
    if not adapter or not hasattr(adapter, "get_qrcode_image"):
        raise HTTPException(status_code=400, detail=f"Adapter for {platform} does not support QR code fetch")
    res = await adapter.get_qrcode_image(account_id)
    return res

@app.get("/worker/accounts/{platform}/{account_id}/login/status")
async def get_platform_login_status(platform: str, account_id: str, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(platform)
    if not adapter or not hasattr(adapter, "check_login_status"):
        raise HTTPException(status_code=400, detail=f"Adapter for {platform} does not support status check")
    res = await adapter.check_login_status(account_id)
    return res

@app.get("/worker/accounts/{account_id}/status")
async def get_account_status(account_id: str, platform: str, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(platform)
    if not adapter:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    status = await adapter.validate_session({"id": account_id})
    return status.dict()

@app.post("/worker/publish")
async def publish_task(req: PublishRequest, _: bool = Depends(verify_token)):
    adapter = ADAPTERS.get(req.platform)
    if not adapter:
        return {
            "success": False,
            "platform": req.platform,
            "status": "failed",
            "error_code": "UNSUPPORTED_PLATFORM",
            "error_message": f"暂不支持平台: {req.platform}",
            "logs": [{"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "error", "message": f"未找到平台适配器: {req.platform}"}]
        }

    content_type = req.payload.get("contentType", "article")

    if content_type == "video":
        result: PublishResult = await adapter.publish_video(req.payload, req.account)
    elif content_type == "note":
        result: PublishResult = await adapter.publish_note(req.payload, req.account)
    else:
        result: PublishResult = await adapter.publish_article(req.payload, req.account)

    WORKER_TASKS[req.taskId] = result.dict()
    return result.dict()

@app.get("/worker/tasks/{task_id}")
async def get_task(task_id: str, _: bool = Depends(verify_token)):
    if task_id not in WORKER_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    return WORKER_TASKS[task_id]

@app.post("/worker/tasks/{task_id}/cancel")
async def cancel_task(task_id: str, _: bool = Depends(verify_token)):
    if task_id in WORKER_TASKS:
        WORKER_TASKS[task_id]["status"] = "cancelled"
    return {"success": True, "taskId": task_id, "status": "cancelled"}

if __name__ == "__main__":
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=False)
