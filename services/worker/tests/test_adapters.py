import pytest

from app.adapters.toutiao import ToutiaoAdapter
from app.adapters.wechat_mp import WeChatMpAdapter


@pytest.mark.asyncio
async def test_unimplemented_platforms_never_claim_real_publish_success():
    payload = {"title": "真实内容", "content": "真实正文", "contentType": "note"}
    account = {"id": "real-account", "nickname": "真实账号"}

    for adapter in (ToutiaoAdapter(), WeChatMpAdapter()):
        result = await adapter.publish_note(payload, account)
        assert result.success is False
        assert result.status == "failed"
        assert result.error_code == "NOT_CONFIGURED"
        assert result.result_url is None
