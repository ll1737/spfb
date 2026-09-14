import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
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

app = FastAPI(
    title="Multi-Publish RPA Worker Service",
    version="2.4.0",
    description="Python Playwright RPA Worker for Multi-Platform Matrix Publishing"
)

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
    if not authorization:
        # Development permissive fallback
        return True
    token = authorization.replace("Bearer ", "").strip()
    if token != config.WORKER_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized worker access token")
    return True

# Request Models
class LoginRequest(BaseModel):
    platform: str
    sessionId: Optional[str] = None

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
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {req.platform}")

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
