from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

class LoginResult(BaseModel):
    success: bool
    platform: str
    status: str # waiting_scan, confirmed, expired, error
    qr_code_url: Optional[str] = None
    session_data: Optional[Dict[str, Any]] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    error_message: Optional[str] = None

class SessionStatus(BaseModel):
    is_valid: bool
    platform: str
    account_id: str
    nickname: Optional[str] = None
    expired_at: Optional[str] = None
    error: Optional[str] = None

class PublishResult(BaseModel):
    success: bool
    platform: str
    status: str # success, failed
    result_url: Optional[str] = None
    post_id: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    debug_screenshot: Optional[str] = None
    logs: List[Dict[str, Any]] = []

class BasePlatformAdapter(ABC):
    """
    Unified RPA and API platform adapter interface.
    Every platform adapter must implement this contract.
    """
    platform_name: str = "base"
    creator_url: str = ""

    @abstractmethod
    async def login(self, context: Any) -> LoginResult:
        """Launches QR code login or authenticates session"""
        pass

    @abstractmethod
    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        """Validates whether current storageState/cookie is active or expired"""
        pass

    @abstractmethod
    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        """Publishes long form article/column"""
        pass

    @abstractmethod
    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        """Publishes image-text note / short dynamic post"""
        pass

    @abstractmethod
    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        """Publishes short video / video contribution"""
        pass

    @abstractmethod
    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        """Captures failure screenshot, DOM snapshot, and telemetry"""
        pass
