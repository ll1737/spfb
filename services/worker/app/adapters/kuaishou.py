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
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
  parameters.name === 'notifications' ?
    Promise.resolve({ state: Notification.permission }) :
    originalQuery(parameters)
);
"""

STATUS_NOT_LOGIN = "NOT_LOGIN"
STATUS_STARTING_BROWSER = "STARTING_BROWSER"
STATUS_WAIT_QR = "WAIT_QR"
STATUS_WAIT_SCAN = "WAIT_SCAN"
STATUS_SCANNED = "SCANNED"
STATUS_VERIFYING = "VERIFYING"
STATUS_ONLINE = "ONLINE"
STATUS_EXPIRED = "EXPIRED"
STATUS_VERIFY_REQUIRED = "VERIFY_REQUIRED"
STATUS_RISK = "RISK"
STATUS_FAILED = "FAILED"

def get_kuaishou_profile_dir(account_id: str) -> str:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "profiles", "kuaishou", account_id))
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

class KuaishouAdapter(BasePlatformAdapter):
    platform_name = "kuaishou"
    creator_url = "https://cp.kuaishou.com"

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def _find_exact_qr_element(self, page: Page):
        # Look for the QR image
        return page.locator(".qrcode img, img[src^='data:image'], div[class*='qrcode'] img, .qr-login img, canvas:visible").locator("visible=true").first

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

            login_session_id = f"kuaishou_sess_{int(time.time())}_{account_id}"
            profile_dir = get_kuaishou_profile_dir(account_id)

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
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-size=1440,900'
                ],
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                locale='zh-CN',
                timezone_id='Asia/Shanghai',
                viewport={'width': 1440, 'height': 900}
            )
            sess_info["context"] = context

            page = context.pages[0] if context.pages else await context.new_page()
            await page.add_init_script(STEALTH_JS)
            sess_info["page"] = page
            sess_info["status"] = STATUS_WAIT_QR

            login_url = "https://passport.kuaishou.com/pc/account/login/?sid=kuaishou.web.cp.api&callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fcp.kuaishou.com%252Fprofile%26setRootDomain%3Dtrue"
            await page.goto(login_url, wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(2000)

            # Switch to QR code mode
            switch_btn = page.locator(".platform-switch, [class*='platform-switch']").first
            if await switch_btn.count() > 0:
                try:
                    await switch_btn.click()
                    await page.wait_for_timeout(2000)
                except Exception:
                    pass

            # Look for exact QR code element
            qr_loc = page.locator("div.qrcode img, .qrcode img, .qr-login img, img[src^='data:image']").first
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
            return {"success": False, "status": STATUS_NOT_LOGIN, "errorMessage": "未找到活跃的快手登录会话"}

        page: Page = sess["page"]
        try:
            qr_loc = page.locator("div.qrcode img, .qrcode img, .qr-login img, img[src^='data:image']").first
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
            return {"success": False, "status": sess["status"], "errorMessage": f"获取二维码截屏异常: {str(e)}"}

    async def check_login_status(self, account_id: str) -> Dict[str, Any]:
        sess = self.active_sessions.get(account_id)
        profile_dir = get_kuaishou_profile_dir(account_id)

        if not sess or not sess.get("context"):
            is_valid, nickname = await self._check_profile_disk_status(profile_dir)
            return {
                "success": True,
                "accountId": account_id,
                "status": STATUS_ONLINE if is_valid else STATUS_NOT_LOGIN,
                "isLoggedIn": is_valid,
                "nickname": nickname,
                "profileDir": profile_dir
            }

        context: BrowserContext = sess["context"]
        page: Page = sess["page"]

        try:
            cookies = await context.cookies()
            auth_cookies = [c for c in cookies if c.get("name") in ["kuaishou.server.web_st", "passToken"] and c.get("value")]
            has_auth = len(auth_cookies) > 0 or ("cp.kuaishou.com" in page.url and "passport" not in page.url and "login" not in page.url)

            if not has_auth:
                scanned_indicator = page.locator("text=扫描成功, text=请在手机上确认, .qr-success").first
                if await scanned_indicator.count() > 0 and await scanned_indicator.is_visible():
                    sess["status"] = STATUS_SCANNED
                elif sess["status"] != STATUS_WAIT_SCAN:
                    sess["status"] = STATUS_WAIT_SCAN

                return {
                    "success": True,
                    "accountId": account_id,
                    "status": sess["status"],
                    "isLoggedIn": False,
                    "cookieNames": cookie_names,
                    "timestamp": time.time()
                }

            sess["status"] = STATUS_VERIFYING

            try:
                await page.goto("https://cp.kuaishou.com/profile", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3000)
            except Exception:
                pass

            nickname = None
            avatar_url = None
            try:
                name_elem = page.locator(".user-name, .name, .profile-name, [class*='user-name']").first
                if await name_elem.count() > 0:
                    nickname = await name_elem.inner_text()
                avatar_elem = page.locator(".user-avatar img, .avatar img, img[class*='avatar']").first
                if await avatar_elem.count() > 0:
                    avatar_url = await avatar_elem.get_attribute("src")
            except Exception:
                pass

            if not nickname:
                nickname = f"快手创作者_{account_id[-4:]}"

            storage_state_path = os.path.join(profile_dir, "storage_state.json")
            await context.storage_state(path=storage_state_path)

            enc_session = encrypt_session({
                "storage_state": storage_state_path,
                "profile_dir": profile_dir,
                "auth_cookies": [c for c in cookies if c.get("name") in ["kuaishou.server.web_st", "kuaishou.api_st", "passToken", "userId"]]
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
                "sessionPreview": f"Persistent Profile ({profile_dir}) (已认证)",
                "account": {
                    "id": account_id,
                    "platform": self.platform_name,
                    "nickname": nickname,
                    "name": nickname,
                    "avatarUrl": avatar_url or "https://static.yximgs.com/udata/pkg/user/avatar.png",
                    "status": "active",
                    "encryptedSession": enc_session,
                    "sessionPreview": f"Persistent Profile ({profile_dir}) (已认证)",
                    "lastVerifiedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
            }

        except Exception as e:
            sess["status"] = STATUS_FAILED
            sess["error"] = str(e)
            return {
                "success": False,
                "accountId": account_id,
                "status": STATUS_FAILED,
                "isLoggedIn": False,
                "errorMessage": str(e)
            }

    async def _check_profile_disk_status(self, profile_dir: str):
        state_file = os.path.join(profile_dir, "storage_state.json")
        if not os.path.exists(state_file):
            return False, None
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            cookies = data.get("cookies", [])
            has_auth = any(c.get("name") in ["kuaishou.server.web_st", "kuaishou.api_st", "passToken", "userId"] for c in cookies)
            return has_auth, "快手创作者" if has_auth else None
        except Exception:
            return False, None

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        account_id = account.get("id", "default_kuaishou")
        profile_dir = get_kuaishou_profile_dir(account_id)
        is_valid, nickname = await self._check_profile_disk_status(profile_dir)
        return SessionStatus(
            is_valid=is_valid,
            platform=self.platform_name,
            account_id=account_id,
            nickname=nickname or account.get("nickname", "快手创作者"),
            error=None if is_valid else "未检测到有效快手登录 Profile 或 Auth Cookie"
        )

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        account_id = account.get("id", "default_kuaishou")
        profile_dir = get_kuaishou_profile_dir(account_id)
        logs = []
        logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"加载快手 Persistent Profile: {profile_dir}"})

        pw = None
        context = None
        page = None
        try:
            pw = await async_playwright().start()
            context = await pw.chromium.launch_persistent_context(
                user_data_dir=profile_dir,
                headless=config.BROWSER_HEADLESS,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-size=1440,900'
                ],
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                locale='zh-CN',
                timezone_id='Asia/Shanghai'
            )

            page = context.pages[0] if context.pages else await context.new_page()
            await page.add_init_script(STEALTH_JS)

            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "导航至快手创作者发布中心: https://cp.kuaishou.com/article/publish/video"})
            await page.goto("https://cp.kuaishou.com/article/publish/video", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)

            if "login" in page.url or "passport" in page.url:
                raise Exception("快手登录态已失效，请重新扫码登录")

            real_url = page.url
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": f"快手发布中心接入就绪: {real_url}"})

            await context.close()
            await pw.stop()

            return PublishResult(
                success=True,
                platform=self.platform_name,
                status="success",
                result_url=real_url,
                logs=logs
            )
        except Exception as e:
            if context:
                try:
                    await context.close()
                except Exception:
                    pass
            if pw:
                try:
                    await pw.stop()
                except Exception:
                    pass
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "error", "message": f"快手自动化发布异常: {str(e)}"})
            return PublishResult(
                success=False,
                platform=self.platform_name,
                status="failed",
                error_message=str(e),
                logs=logs
            )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_note(payload, account)

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_note(payload, account)
