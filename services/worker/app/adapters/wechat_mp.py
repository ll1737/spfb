import time
from typing import Dict, Any
from .base import BasePlatformAdapter, LoginResult, SessionStatus, PublishResult

class WeChatMpAdapter(BasePlatformAdapter):
    platform_name = "wechat_mp"
    creator_url = "https://mp.weixin.qq.com"

    SELECTORS = {
        "login_qr": ".login__type__container__scan__qrcode",
        "new_draft_btn": "text=新的创作, text=写新图文",
        "title_input": "#title, input[placeholder*='标题']",
        "author_input": "#author",
        "save_draft_btn": "button:has-text('保存为草稿')",
        "publish_btn": "button:has-text('发表')"
    }

    async def login(self, context: Any) -> LoginResult:
        return LoginResult(
            success=False,
            platform=self.platform_name,
            status="error",
            error_message="微信公众号真实扫码登录适配器尚未配置"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=False,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname"),
            error="微信公众号真实 session 校验适配器尚未配置"
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return self.not_configured_result("公众号草稿/发布")

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_wechat.png"}
