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
            success=False,
            platform=self.platform_name,
            status="error",
            error_message="今日头条真实扫码登录适配器尚未配置"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=False,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname"),
            error="今日头条真实 session 校验适配器尚未配置"
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return self.not_configured_result("图文发布")

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return self.not_configured_result("微头条发布")

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_toutiao.png"}
