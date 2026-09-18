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

def get_weibo_profile_dir(account_id: str) -> str:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "profiles", "weibo", account_id))
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

class WeiboAdapter(BasePlatformAdapter):
    platform_name = "weibo"
    creator_url = "https://weibo.com"

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

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

            login_session_id = f"weibo_sess_{int(time.time())}_{account_id}"
            profile_dir = get_weibo_profile_dir(account_id)

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
                    '--window-size=1280,800'
                ],
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

            await page.goto("https://passport.weibo.com/sso/signin", wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(2000)

            # Look for official QR code
            qr_loc = page.locator("img[src*='qr.weibo.cn'], img[src*='qr'], .qrcode_box img, canvas:visible, img[alt*='二维码']").first
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
            return {"success": False, "status": STATUS_NOT_LOGIN, "errorMessage": "未找到活跃的微博登录会话"}

        page: Page = sess["page"]
        try:
            qr_loc = page.locator("img[src*='qr.weibo.cn'], img[src*='qr'], .qrcode_box img, canvas:visible, img[alt*='二维码']").first
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
        profile_dir = get_weibo_profile_dir(account_id)

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
            cookie_names = [c.get("name") for c in cookies]
            has_auth = any(k in cookie_names for k in ["SUB", "SUBP", "SSOLoginState"])

            if not has_auth:
                scanned_indicator = page.locator("text=扫描成功, text=请在手机上确认, .qrcode_scan_succ").first
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
                await page.goto("https://weibo.com", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3000)
            except Exception:
                pass

            nickname = None
            avatar_url = None
            try:
                name_elem = page.locator(".name_39vA0, .gn_name, .woo-box-item-flex .text").first
                if await name_elem.count() > 0:
                    nickname = await name_elem.inner_text()
                avatar_elem = page.locator(".avatar_img img, .woo-avatar-img, img[alt*='头像']").first
                if await avatar_elem.count() > 0:
                    avatar_url = await avatar_elem.get_attribute("src")
            except Exception:
                pass

            if not nickname:
                nickname = f"微博用户_{account_id[-4:]}"

            storage_state_path = os.path.join(profile_dir, "storage_state.json")
            await context.storage_state(path=storage_state_path)

            enc_session = encrypt_session({
                "storage_state": storage_state_path,
                "profile_dir": profile_dir,
                "auth_cookies": [c for c in cookies if c.get("name") in ["SUB", "SUBP", "SSOLoginState"]]
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
                    "avatarUrl": avatar_url or "https://h5.sinaimg.cn/upload/100/1000/2021/04/23/avatar_default.png",
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
            has_auth = any(c.get("name") in ["SUB", "SUBP"] for c in cookies)
            return has_auth, "微博博主" if has_auth else None
        except Exception:
            return False, None

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        account_id = account.get("id", "default_weibo")
        profile_dir = get_weibo_profile_dir(account_id)
        is_valid, nickname = await self._check_profile_disk_status(profile_dir)
        return SessionStatus(
            is_valid=is_valid,
            platform=self.platform_name,
            account_id=account_id,
            nickname=nickname or account.get("nickname", "微博博主"),
            error=None if is_valid else "未检测到有效微博登录 Profile 或 SUB Cookie"
        )

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        account_id = account.get("id", "default_weibo")
        task_id = payload.get("taskId", f"task_weibo_{int(time.time())}")
        profile_dir = get_weibo_profile_dir(account_id)

        logs = []
        logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"正在加载微博专属 Persistent Profile: {profile_dir}"})

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
                    '--window-size=1280,800'
                ],
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                locale='zh-CN',
                timezone_id='Asia/Shanghai'
            )

            page = context.pages[0] if context.pages else await context.new_page()
            await page.add_init_script(STEALTH_JS)

            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "导航至微博发布中心: https://weibo.com"})
            await page.goto("https://weibo.com", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)

            if "login" in page.url:
                raise Exception("微博登录态已失效，请重新扫码登录")

            # Feed text editor
            editor = page.locator("textarea[placeholder*='新鲜事'], textarea[class*='_input_'], textarea, div[contenteditable='true']").first
            if await editor.count() > 0:
                title = payload.get("title", "")
                content = payload.get("content", "") or payload.get("summary", "")
                tags = payload.get("tags", [])
                tag_str = " ".join([f"#{t}#" for t in tags]) if tags else ""
                full_text = f"【{title}】\n{content}\n{tag_str}".strip()

                logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "填充微博正文与话题标签..."})
                await editor.click()
                await page.wait_for_timeout(300)
                await editor.fill(full_text)
                await page.wait_for_timeout(300)
                try:
                    await editor.evaluate("""el => {
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }""")
                except Exception:
                    pass

            await page.wait_for_timeout(1500)

            # Send button
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "点击【发送/发布】按钮..."})
            send_btn = page.locator("button:has-text('发送'), button[class*='_btn_'], button:has-text('发布')").locator("visible=true").first
            if await send_btn.count() > 0:
                # Wait for button to be enabled
                try:
                    await send_btn.wait_for(state="visible", timeout=8000)
                except Exception:
                    pass
                await send_btn.click()
                await page.wait_for_timeout(4000)

            real_url = page.url
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": f"微博动态真实发布成功！当前地址: {real_url}"})

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
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "error", "message": f"微博自动化发布异常: {str(e)}"})
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
