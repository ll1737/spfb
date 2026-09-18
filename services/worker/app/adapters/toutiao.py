import time
import os
import json
import base64
import asyncio
from typing import Dict, Any, Optional, List
from playwright.async_api import async_playwright, Page, BrowserContext
from app.core.config import config
from app.core.crypto import decrypt_session, encrypt_session
from .base import BasePlatformAdapter, LoginResult, SessionStatus, PublishResult

STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
"""

STATUS_NOT_LOGIN = "NOT_LOGIN"
STATUS_STARTING_BROWSER = "STARTING_BROWSER"
STATUS_WAIT_QR = "WAIT_QR"
STATUS_WAIT_SCAN = "WAIT_SCAN"
STATUS_SCANNED = "SCANNED"
STATUS_VERIFYING = "VERIFYING"
STATUS_ONLINE = "ONLINE"
STATUS_FAILED = "FAILED"

def get_toutiao_profile_dir(account_id: str) -> str:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "profiles", "toutiao", account_id))
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

class ToutiaoAdapter(BasePlatformAdapter):
    platform_name = "toutiao"
    creator_url = "https://mp.toutiao.com"

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def _find_exact_qr_element(self, page: Page):
        return page.locator(".qrcode img, img.qrcode, .login-box img, canvas:visible, img[src*='qrcode'], .web-login-mobile-code img").locator("visible=true").first

    async def start_login_session(self, account_id: str) -> Dict[str, Any]:
        async with self._lock:
            if account_id in self.active_sessions:
                try:
                    old_sess = self.active_sessions[account_id]
                    if old_sess.get("context"):
                        await old_sess["context"].close()
                    if old_sess.get("playwright"):
                        await old_sess["playwright"].stop()
                except Exception:
                    pass
                del self.active_sessions[account_id]

            login_session_id = f"tt_sess_{int(time.time())}_{account_id}"
            profile_dir = get_toutiao_profile_dir(account_id)

            sess_info: Dict[str, Any] = {
                "account_id": account_id,
                "session_id": login_session_id,
                "status": STATUS_STARTING_BROWSER,
                "created_at": time.time(),
                "profile_dir": profile_dir,
                "context": None,
                "page": None,
                "playwright": None,
                "qr_code_b64": None,
                "error": None,
                "nickname": None,
                "avatar_url": None
            }
            self.active_sessions[account_id] = sess_info

        try:
            pw = await async_playwright().start()
            sess_info["playwright"] = pw

            context = await pw.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                headless=config.BROWSER_HEADLESS,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                locale='zh-CN',
                timezone_id='Asia/Shanghai',
                viewport={'width': 1280, 'height': 800}
            )
            sess_info["context"] = context

            page = context.pages[0] if context.pages else await context.new_page()
            await page.add_init_script(STEALTH_JS)
            sess_info["page"] = page
            sess_info["status"] = STATUS_WAIT_QR

            await page.goto("https://mp.toutiao.com/", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)

            qr_loc = await self._find_exact_qr_element(page)
            await qr_loc.wait_for(state="visible", timeout=15000)

            qr_bytes = await qr_loc.screenshot()
            sess_info["qr_code_b64"] = "data:image/png;base64," + base64.b64encode(qr_bytes).decode("utf-8")
            sess_info["status"] = STATUS_WAIT_SCAN

            return {
                "success": True,
                "accountId": account_id,
                "loginSessionId": login_session_id,
                "status": STATUS_WAIT_SCAN,
                "profileDir": profile_dir
            }
        except Exception as e:
            sess_info["status"] = STATUS_FAILED
            sess_info["error"] = str(e)
            return {
                "success": False,
                "accountId": account_id,
                "loginSessionId": login_session_id,
                "status": STATUS_FAILED,
                "errorMessage": str(e)
            }

    async def get_qrcode_image(self, account_id: str) -> Dict[str, Any]:
        sess = self.active_sessions.get(account_id)
        if not sess or not sess.get("page"):
            return {"success": False, "status": STATUS_NOT_LOGIN, "errorMessage": "未找到活跃的今日头条登录会话"}

        page: Page = sess["page"]
        try:
            qr_loc = await self._find_exact_qr_element(page)
            if await qr_loc.count() > 0 and await qr_loc.is_visible():
                qr_bytes = await qr_loc.screenshot()
                qr_b64 = "data:image/png;base64," + base64.b64encode(qr_bytes).decode("utf-8")
                sess["qr_code_b64"] = qr_b64
                return {"success": True, "status": sess["status"], "qrCodeUrl": qr_b64}
            elif sess.get("qr_code_b64"):
                return {"success": True, "status": sess["status"], "qrCodeUrl": sess["qr_code_b64"]}
            else:
                return {"success": False, "status": sess["status"], "errorMessage": "二维码元素暂不可见"}
        except Exception as e:
            return {"success": False, "status": sess["status"], "errorMessage": f"获取二维码异常: {str(e)}"}

    async def check_login_status(self, account_id: str) -> Dict[str, Any]:
        sess = self.active_sessions.get(account_id)
        profile_dir = get_toutiao_profile_dir(account_id)

        if not sess or not sess.get("context"):
            return {
                "success": True,
                "accountId": account_id,
                "status": STATUS_NOT_LOGIN,
                "isLoggedIn": False,
                "profileDir": profile_dir
            }

        context: BrowserContext = sess["context"]
        page: Page = sess["page"]

        try:
            cookies = await context.cookies()
            cookie_names = [c.get("name") for c in cookies]
            auth_cookies = [c for c in cookies if c.get("name") in ["sessionid", "sessionid_ss"] and c.get("value")]
            has_auth = len(auth_cookies) > 0

            if not has_auth:
                return {
                    "success": True,
                    "accountId": account_id,
                    "status": sess["status"],
                    "isLoggedIn": False,
                    "cookieNames": cookie_names,
                    "timestamp": time.time()
                }

            sess["status"] = STATUS_VERIFYING
            nickname = None
            avatar_url = None

            try:
                name_elem = page.locator(".user-name, .header-user-name, .profile-name, .name").first
                if await name_elem.count() > 0:
                    nickname = await name_elem.inner_text()
                avatar_elem = page.locator(".avatar img, .user-avatar img, img[class*='avatar']").first
                if await avatar_elem.count() > 0:
                    avatar_url = await avatar_elem.get_attribute("src")
            except Exception:
                pass

            if not nickname:
                nickname = f"今日头条创作者_{account_id[-4:]}"

            storage_state_path = os.path.join(profile_dir, "storage_state.json")
            await context.storage_state(path=storage_state_path)

            enc_session = encrypt_session({
                "storage_state": storage_state_path,
                "profile_dir": profile_dir,
                "auth_cookies": [c for c in cookies if c.get("name") in ["sessionid", "passport_csrf_token"]]
            })

            sess["status"] = STATUS_ONLINE
            sess["nickname"] = nickname
            sess["avatar_url"] = avatar_url

            try:
                await context.close()
                if sess.get("playwright"):
                    await sess["playwright"].stop()
            except Exception:
                pass

            return {
                "success": True,
                "accountId": account_id,
                "status": STATUS_ONLINE,
                "isLoggedIn": True,
                "nickname": nickname,
                "avatarUrl": avatar_url,
                "encryptedSession": enc_session,
                "profileDir": profile_dir
            }
        except Exception as e:
            return {
                "success": False,
                "accountId": account_id,
                "status": STATUS_FAILED,
                "errorMessage": str(e)
            }

    async def login(self, context: Any) -> LoginResult:
        return LoginResult(
            success=False,
            platform=self.platform_name,
            status="error",
            error_message="请使用扫码授权登录"
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        return SessionStatus(
            is_valid=True,
            platform=self.platform_name,
            account_id=account.get("id", ""),
            nickname=account.get("nickname")
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return self.not_configured_result("图文发布")

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return self.not_configured_result("微头条发布")

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_toutiao.png"}
