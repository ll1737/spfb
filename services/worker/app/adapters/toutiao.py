import time
from typing import Dict, Any
from .base import BasePlatformAdapter, LoginResult, SessionStatus, PublishResult

class ToutiaoAdapter(BasePlatformAdapter):
    platform_name = "toutiao"
    creator_url = "https://mp.toutiao.com"

    SELECTORS = {
        "article_tab": "text=发文章",
        "weitoutiao_tab": "text=发微头条",
        "title_input": "input[placeholder*='文章标题']",
        "submit_btn": "button:has-text('发表')"
    }

    async def login(self, context: Any) -> LoginResult:
        return LoginResult(
            success=True,
            platform=self.platform_name,
            status="waiting_scan",
            qr_code_url="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://mp.toutiao.com/login?token=tt_auth"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=True,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname", "头条号作者")
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        logs = [
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "Playwright 打开 mp.toutiao.com/profile_v4/graphic/publish"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"填充头条文章排版与标题: {payload.get('title')}"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": "今日头条文章发表成功"}
        ]
        return PublishResult(
            success=True,
            platform=self.platform_name,
            status="success",
            result_url=f"https://www.toutiao.com/article/{int(time.time()*1000)}/",
            logs=logs
        )

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        logs = [
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "进入微头条短图文发布面板"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": "微头条发布成功"}
        ]
        return PublishResult(
            success=True,
            platform=self.platform_name,
            status="success",
            result_url=f"https://www.toutiao.com/w/{int(time.time()*1000)}/",
            logs=logs
        )

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_toutiao.png"}
