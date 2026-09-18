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

# Status constants
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

def get_zhihu_profile_dir(account_id: str) -> str:
    # Resolve relative to project root data/profiles/zhihu/{account_id}
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "profiles", "zhihu", account_id))
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

class ZhihuAdapter(BasePlatformAdapter):
    platform_name = "zhihu"
    creator_url = "https://zhuanlan.zhihu.com/write"

    def __init__(self):
        # account_id -> { context, page, session_id, status, created_at, profile_dir, playwright, error }
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def start_login_session(self, account_id: str) -> Dict[str, Any]:
        async with self._lock:
            # Clean existing session if any
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

            login_session_id = f"zh_sess_{int(time.time())}_{account_id}"
            profile_dir = get_zhihu_profile_dir(account_id)

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

            # Launch Persistent Browser Context with independent Profile
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

            # Navigate to Zhihu Signin
            await page.goto("https://www.zhihu.com/signin", wait_until="domcontentloaded", timeout=30000)

            # Check if QR code tab needs clicking
            for sel in [".SignFlow-tabs button", "button:has-text('二维码')", ".SignContainer-switch"]:
                try:
                    qr_tab = page.locator(sel).first
                    if await qr_tab.count() > 0 and await qr_tab.is_visible():
                        await qr_tab.click()
                        break
                except Exception:
                    pass

            # Wait for QR code image or canvas
            qr_loc = page.locator(".Qrcode-img img, img[alt*='二维码'], canvas, .SignContainer-qrcode img, .Qrcode img").first
            await qr_loc.wait_for(state="visible", timeout=15000)

            # Capture initial QR code screenshot
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
            return {"success": False, "status": STATUS_NOT_LOGIN, "errorMessage": "未找到活跃的知乎登录会话，请先调用 start 接口"}

        page: Page = sess["page"]
        try:
            # Check if page still has QR code or updated
            qr_loc = page.locator(".Qrcode-img img, img[alt*='二维码'], canvas, .SignContainer-qrcode img").first
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
        profile_dir = get_zhihu_profile_dir(account_id)

        # If no in-memory active session, check existing profile cookies on disk
        if not sess or not sess.get("context"):
            is_valid, nickname = await self._check_profile_disk_status(profile_dir)
            avatar_url = None
            if is_valid:
                try:
                    meta_path = os.path.join(profile_dir, "profile_meta.json")
                    if os.path.exists(meta_path):
                        with open(meta_path, "r", encoding="utf-8") as f:
                            meta = json.load(f)
                            nickname = meta.get("nickname") or nickname
                            avatar_url = meta.get("avatar_url")
                except Exception:
                    pass
            enc_session = encrypt_session({"profile_dir": profile_dir, "nickname": nickname}) if is_valid else ""
            return {
                "success": True,
                "accountId": account_id,
                "status": STATUS_ONLINE if is_valid else STATUS_NOT_LOGIN,
                "isLoggedIn": is_valid,
                "nickname": nickname,
                "avatarUrl": avatar_url,
                "profileDir": profile_dir,
                "encryptedSession": enc_session,
                "credentialMode": "local_profile"
            }

        context: BrowserContext = sess["context"]
        page: Page = sess["page"]

        try:
            cookies = await context.cookies()
            cookie_names = [c.get("name") for c in cookies]
            has_z_c0 = "z_c0" in cookie_names

            if not has_z_c0:
                # Check for scan/risk indicators on page
                scanned_indicator = page.locator("text=扫描成功, text=请在手机上确认, .Qrcode-status-scanned").first
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

            # z_c0 detected! Transition to VERIFYING
            sess["status"] = STATUS_VERIFYING

            # Step: Navigate to https://www.zhihu.com/hot to warm up and fetch complete security cookies (__zse_ck, etc.)
            try:
                await page.goto("https://www.zhihu.com/hot", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3500) # 3.5s for Zhihu frontend scripts to finalize session
            except Exception:
                pass

            # Check cookies again
            final_cookies = await context.cookies()
            final_cookie_names = [c.get("name") for c in final_cookies]
            
            # Extract nickname / avatar
            nickname = None
            avatar_url = None

            # 1. Try Zhihu official me API in page context
            try:
                user_data = await page.evaluate("""async () => {
                    try {
                        const res = await fetch('/api/v4/me');
                        if (res.ok) return await res.json();
                    } catch (e) {}
                    return null;
                }""")
                if user_data:
                    nickname = user_data.get("name") or user_data.get("nickname")
                    avatar_url = user_data.get("avatar_url") or user_data.get("avatar_url_template")
            except Exception:
                pass

            # 2. Fallback to DOM selectors if API is throttled
            if not nickname or not avatar_url:
                try:
                    avatar_elem = page.locator(".AppHeader-profileAvatar, img.Avatar, .AppHeader-profile img, .UserAvatar img").first
                    if await avatar_elem.count() > 0 and not avatar_url:
                        avatar_url = await avatar_elem.get_attribute("src")
                    name_elem = page.locator(".AppHeader-profileName, .ProfileHeader-name, .AppHeader-profile button, a[href*='/people/']").first
                    if await name_elem.count() > 0 and not nickname:
                        nickname = await name_elem.inner_text()
                except Exception:
                    pass

            if not nickname:
                nickname = f"知乎用户_{account_id[-4:]}"

            # Save persistent storage_state.json and profile_meta.json in profile dir
            storage_state_path = os.path.join(profile_dir, "storage_state.json")
            await context.storage_state(path=storage_state_path)

            try:
                meta_path = os.path.join(profile_dir, "profile_meta.json")
                with open(meta_path, "w", encoding="utf-8") as f:
                    json.dump({"nickname": nickname, "avatar_url": avatar_url}, f, ensure_ascii=False)
            except Exception:
                pass

            enc_session = encrypt_session({
                "storage_state": storage_state_path,
                "profile_dir": profile_dir,
                "nickname": nickname,
                "avatar_url": avatar_url,
                "auth_cookies": [c for c in final_cookies if c.get("name") in ["z_c0", "_zap", "d_c0", "__zse_ck"]]
            })

            sess["status"] = STATUS_ONLINE
            sess["nickname"] = nickname
            sess["avatar_url"] = avatar_url

            # Close browser context cleanly so profile is locked properly to disk for subsequent publishing
            try:
                await context.close()
                if sess.get("playwright"):
                    await sess["playwright"].stop()
            except Exception:
                pass
            
            # Clean active session
            del self.active_sessions[account_id]

            return {
                "success": True,
                "accountId": account_id,
                "status": STATUS_ONLINE,
                "isLoggedIn": True,
                "nickname": nickname,
                "avatarUrl": avatar_url,
                "profileDir": profile_dir,
                "encryptedSession": enc_session,
                "sessionPreview": f"Playwright RPA 实时授权 (真实账号：{nickname})",
                "credentialMode": "local_profile",
                "account": {
                    "id": account_id,
                    "platform": self.platform_name,
                    "nickname": nickname,
                    "name": nickname,
                    "avatarUrl": avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={account_id}",
                    "status": "active",
                    "encryptedSession": enc_session,
                    "sessionPreview": f"Playwright RPA 实时授权 (真实账号：{nickname})",
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

    async def _check_profile_disk_status(self, profile_dir: str) -> (bool, Optional[str]):
        storage_state_path = os.path.join(profile_dir, "storage_state.json")
        if not os.path.exists(storage_state_path):
            return False, None
        try:
            with open(storage_state_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                cookies = data.get("cookies", [])
                has_zc0 = any(c.get("name") == "z_c0" and c.get("value") for c in cookies)
                
                cached_name = "知乎创作者"
                meta_path = os.path.join(profile_dir, "profile_meta.json")
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, "r", encoding="utf-8") as mf:
                            meta = json.load(mf)
                            if meta.get("nickname"):
                                cached_name = meta["nickname"]
                    except Exception:
                        pass

                return has_zc0, cached_name if has_zc0 else None
        except Exception:
            return False, None

    async def login(self, context: Any = None) -> LoginResult:
        # Backward-compatible adapter interface
        account_id = context.get("id", "default_zh") if isinstance(context, dict) else "default_zh"
        res = await self.start_login_session(account_id)
        if not res.get("success"):
            return LoginResult(success=False, platform=self.platform_name, status="error", error_message=res.get("errorMessage"))
        
        qr_res = await self.get_qrcode_image(account_id)
        return LoginResult(
            success=True,
            platform=self.platform_name,
            status=res.get("status", STATUS_WAIT_SCAN),
            qr_code_url=qr_res.get("qrCodeUrl"),
            error_message=None
        )

    async def validate_session(self, account: Dict[str, Any]) -> SessionStatus:
        account_id = account.get("id", "default_zh")
        profile_dir = get_zhihu_profile_dir(account_id)
        is_valid, nickname = await self._check_profile_disk_status(profile_dir)
        return SessionStatus(
            is_valid=is_valid,
            platform=self.platform_name,
            account_id=account_id,
            nickname=nickname or account.get("nickname", "知乎创作者"),
            error=None if is_valid else "未检测到有效知乎登录 Profile 或 z_c0 Cookie"
        )

    async def publish_article(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        account_id = account.get("id", "default_zh")
        task_id = payload.get("taskId", f"task_zh_{int(time.time())}")
        profile_dir = get_zhihu_profile_dir(account_id)
        
        logs = []
        logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"正在加载知乎专属 Persistent Profile: {profile_dir}"})

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
                timezone_id='Asia/Shanghai',
                viewport={'width': 1440, 'height': 900}
            )

            # Pre-flight check: Verify z_c0 cookie in persistent context
            cookies = await context.cookies()
            cookie_names = [c.get("name") for c in cookies]
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"已读取持久化 Cookie 列表: {', '.join(cookie_names) if cookie_names else '无'}"})

            if "z_c0" not in cookie_names:
                screenshot_dir = os.path.abspath(config.SCREENSHOT_DIR)
                os.makedirs(screenshot_dir, exist_ok=True)
                shot_path = os.path.join(screenshot_dir, f"{task_id}_zhihu_expired.png")
                page = context.pages[0] if context.pages else await context.new_page()
                await page.goto("https://www.zhihu.com/signin", wait_until="domcontentloaded", timeout=15000)
                await page.screenshot(path=shot_path, full_page=True)
                
                await context.close()
                await pw.stop()
                return PublishResult(
                    success=False,
                    platform=self.platform_name,
                    status="failed",
                    error_code="EXPIRED",
                    error_message="知乎登录凭据已过期或缺失 z_c0，请前往【账号管理】重新发起知乎扫码登录",
                    debug_screenshot=shot_path,
                    logs=logs
                )

            page = context.pages[0] if context.pages else await context.new_page()
            await page.add_init_script(STEALTH_JS)

            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "导航至知乎专栏创作者中心: " + self.creator_url})
            response = await page.goto(self.creator_url, wait_until="domcontentloaded", timeout=30000)

            # Check if redirected to signin
            if "signin" in page.url or (response and response.status == 401):
                screenshot_dir = os.path.abspath(config.SCREENSHOT_DIR)
                os.makedirs(screenshot_dir, exist_ok=True)
                shot_path = os.path.join(screenshot_dir, f"{task_id}_zhihu_redirect.png")
                await page.screenshot(path=shot_path, full_page=True)
                
                await context.close()
                await pw.stop()
                return PublishResult(
                    success=False,
                    platform=self.platform_name,
                    status="failed",
                    error_code="EXPIRED",
                    error_message="知乎页面被重定向至登录页，登录态失效，请重新扫码",
                    debug_screenshot=shot_path,
                    logs=logs
                )

            # Fill title
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "定位文章标题输入框并填入标题: " + payload.get("title", "")})
            title_input = page.locator("textarea.WriteIndex-titleInput, textarea[placeholder*='标题'], textarea.Input").first
            await title_input.wait_for(state="visible", timeout=15000)
            await title_input.click()
            await title_input.fill(payload.get("title", ""))

            # Fill content into DraftEditor
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "定位正文富文本编辑器并注入正文内容..."})
            editor = page.locator(".DraftEditor-editorContainer [contenteditable='true'], .public-DraftEditor-content, div[contenteditable='true']").first
            await editor.wait_for(state="visible", timeout=12000)
            await editor.click()

            content_text = payload.get("content", "") or payload.get("summary", "")
            await page.keyboard.insert_text(content_text)

            # Topics/Tags handling
            tags = payload.get("tags", [])
            if tags:
                logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": f"尝试添加话题: {', '.join(tags)}"})
                tag_btn = page.locator("button:has-text('添加话题'), input[placeholder*='添加话题']").first
                if await tag_btn.count() > 0 and await tag_btn.is_visible():
                    try:
                        await tag_btn.click()
                        await page.keyboard.type(tags[0])
                        await page.keyboard.press("Enter")
                    except Exception:
                        pass

            # Wait for draft auto-save
            await page.wait_for_timeout(2500)

            # Click Publish button
            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "info", "message": "点击【发布】按钮并监听平台发布网络响应..."})
            publish_btn = page.locator("button.Button--primary:has-text('发布'), button.Button--blue:has-text('发布'), button:text-is('发布')").last
            await publish_btn.wait_for(state="visible", timeout=10000)

            pub_res = None
            try:
                async with page.expect_response(
                    lambda res: ("api" in res.url or "zhuanlan.zhihu.com/p/" in res.url) and res.status in [200, 201],
                    timeout=15000
                ) as response_info:
                    await publish_btn.click()
                pub_res = await response_info.value
            except Exception:
                await publish_btn.click()

            res_json = {}
            if pub_res:
                try:
                    res_json = await pub_res.json()
                except Exception:
                    pass

            try:
                await page.wait_for_url(lambda u: "/p/" in u, timeout=12000)
            except Exception:
                await page.wait_for_timeout(3000)

            final_url = page.url
            article_id = None
            if "/p/" in final_url:
                article_id = final_url.split("/p/")[-1].split("?")[0].split("/")[0]
            if not article_id and res_json:
                article_id = res_json.get("id") or (res_json.get("url", "").split("/")[-1] if res_json.get("url") else None)

            real_url = f"https://zhuanlan.zhihu.com/p/{article_id}" if article_id else final_url

            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "success", "message": f"知乎专栏真实发布成功！线上地址: {real_url}"})

            await context.close()
            await pw.stop()

            return PublishResult(
                success=True,
                platform=self.platform_name,
                status="success",
                result_url=real_url,
                post_id=str(article_id) if article_id else None,
                logs=logs
            )

        except Exception as e:
            screenshot_dir = os.path.abspath(config.SCREENSHOT_DIR)
            os.makedirs(screenshot_dir, exist_ok=True)
            shot_path = os.path.join(screenshot_dir, f"{task_id}_zhihu_err.png")
            if page:
                try:
                    await page.screenshot(path=shot_path, full_page=True)
                except Exception:
                    pass

            logs.append({"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "level": "error", "message": f"知乎自动化执行失败: {str(e)}"})
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

            return PublishResult(
                success=False,
                platform=self.platform_name,
                status="failed",
                error_code="RPA_EXECUTION_ERROR",
                error_message=f"知乎发布执行失败: {str(e)}",
                debug_screenshot=shot_path,
                logs=logs
            )

    async def publish_note(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def publish_video(self, payload: Dict[str, Any], account: Dict[str, Any]) -> PublishResult:
        return await self.publish_article(payload, account)

    async def capture_debug(self, page: Any, task_id: str) -> Dict[str, Any]:
        return {"screenshot": f"debug_snapshots/{task_id}_zhihu.png"}
