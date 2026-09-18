import pytest
import asyncio
from app.core.security import encrypt_session, decrypt_session
from main import ADAPTERS

def test_aes_encryption_decryption():
    raw_payload = {"cookie": "sess_123456", "uid": "user_888", "token": "secret_abc"}
    encrypted = encrypt_session(raw_payload)
    assert encrypted != ""
    assert ":" in encrypted
    decrypted = decrypt_session(encrypted)
    assert decrypted["cookie"] == "sess_123456"
    assert decrypted["uid"] == "user_888"

def test_adapter_registry_contains_only_declared_real_platforms():
    assert set(ADAPTERS) == {
        "douyin",
        "kuaishou",
        "xiaohongshu",
        "weibo",
        "toutiao",
        "wechat_mp",
        "zhihu",
        "bilibili",
    }

@pytest.mark.asyncio
async def test_session_validation_requires_a_real_persistent_profile():
    douyin = ADAPTERS["douyin"]
    status = await douyin.validate_session({"id": "unregistered-account", "nickname": "未接入账号"})
    assert status.is_valid is False
    assert status.platform == "douyin"
    assert status.error

if __name__ == "__main__":
    pytest.main(["-v", __file__])
