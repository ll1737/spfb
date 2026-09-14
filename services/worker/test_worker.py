import pytest
import asyncio
from app.core.security import encrypt_session, decrypt_session
from app.adapters.douyin import DouyinAdapter
from app.adapters.xiaohongshu import XiaohongshuAdapter
from app.adapters.weibo import WeiboAdapter
from app.adapters.bilibili import BilibiliAdapter
from app.adapters.zhihu import ZhihuAdapter

def test_aes_encryption_decryption():
    raw_payload = {"cookie": "sess_123456", "uid": "user_888", "token": "secret_abc"}
    encrypted = encrypt_session(raw_payload)
    assert encrypted != ""
    assert ":" in encrypted
    decrypted = decrypt_session(encrypted)
    assert decrypted["cookie"] == "sess_123456"
    assert decrypted["uid"] == "user_888"

@pytest.mark.asyncio
async def test_adapter_routing_and_execution():
    adapters = [
        DouyinAdapter(),
        XiaohongshuAdapter(),
        WeiboAdapter(),
        BilibiliAdapter(),
        ZhihuAdapter()
    ]

    sample_payload = {
        "title": "测试多平台矩阵发布自动化用例",
        "content": "正文内容自动化检验",
        "contentType": "note",
        "tags": ["自动化测试", "CI/CD"],
        "images": ["https://example.com/test.jpg"]
    }
    sample_account = {"id": "test_acc_01", "nickname": "测试账号"}

    for adapter in adapters:
        result = await adapter.publish_note(sample_payload, sample_account)
        assert result.success is True
        assert result.status == "success"
        assert result.platform == adapter.platform_name
        assert result.result_url is not None
        assert len(result.logs) > 0

@pytest.mark.asyncio
async def test_session_validation():
    douyin = DouyinAdapter()
    status = await douyin.validate_session({"id": "acc_01", "nickname": "抖音号"})
    assert status.is_valid is True
    assert status.platform == "douyin"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
