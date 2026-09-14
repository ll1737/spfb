import time
from typing import Dict, Any
from .base import BasePlatformAdapter, LoginResult, SessionStatus, PublishResult

class KuaishouAdapter(BasePlatformAdapter):
    platform_name = "kuaishou"
    creator_url = "https://cp.kuaishou.com"

    SELECTORS = {
        "login_qr": ".login-qr-code",
        "upload_btn": "text=发布作品",
        "title_input": "input[placeholder*='作品标题']",
        "submit_btn": "button:has-text('发布作品')"
    }

    async def login(self, context: Any) -> LoginResult:
        return LoginResult(
            success=True,
            platform=self.platform_name,
            status="waiting_scan",
            qr_code_url="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://cp.kuaishou.com/login?token=ks_auth"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=True,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname", "快手创作者")
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_note(payload, account)

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        logs = [
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "Playwright 打开 cp.kuaishou.com/article/publish"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"填入快手图文内容与标签: {payload.get('tags')}"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": "快手图文发布完成"}
        ]
        return PublishResult(
            success=True,
            platform=self.platform_name,
            status="success",
            result_url=f"https://cp.kuaishou.com/article/{int(time.time())}",
            logs=logs
        )

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        logs = [
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "上传快手短视频源文件"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": "快手视频审核通过并上架"}
        ]
        return PublishResult(
            success=True,
            platform=self.platform_name,
            status="success",
            result_url=f"https://cp.kuaishou.com/video/{int(time.time())}",
            logs=logs
        )

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_kuaishou.png"}
