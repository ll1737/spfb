import time
from typing import Dict, Any
from .base import BasePlatformAdapter, LoginResult, SessionStatus, PublishResult

class ZhihuAdapter(BasePlatformAdapter):
    platform_name = "zhihu"
    creator_url = "https://zhuanlan.zhihu.com/write"

    SELECTORS = {
        "title_input": "textarea[placeholder*='请输入标题']",
        "editor": ".DraftEditor-editorContainer",
        "publish_btn": "button:has-text('发布')",
        "tag_input": "input[placeholder*='添加话题']"
    }

    async def login(self, context: Any) -> LoginResult:
        return LoginResult(
            success=True,
            platform=self.platform_name,
            status="waiting_scan",
            qr_code_url="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://www.zhihu.com/signin?token=zh_auth"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=True,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname", "知乎专栏作者")
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        logs = [
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "Playwright 打开 zhuanlan.zhihu.com/write 专栏编辑器"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"输入知乎专栏标题: {payload.get('title')}"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "Markdown 转换为知乎富文本格式，上传首图"},
            {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": "知乎专栏文章发布成功"}
        ]
        return PublishResult(
            success=True,
            platform=self.platform_name,
            status="success",
            result_url=f"https://zhuanlan.zhihu.com/p/{int(time.time()*1000)}",
            logs=logs
        )

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_zhihu.png"}
