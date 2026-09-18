import os
import json
import asyncio
from typing import Optional, Dict, Any, Tuple
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from .config import config
from .crypto import decrypt_session, encrypt_session

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

class BrowserManager:
    _instance: Optional['BrowserManager'] = None
    _playwright = None
    _browser: Optional[Browser] = None
    _lock = asyncio.Lock()

    @classmethod
    async def get_instance(cls) -> 'BrowserManager':
        if cls._instance is None:
            cls._instance = BrowserManager()
        return cls._instance

    async def get_browser(self) -> Browser:
        async with self._lock:
            if self._playwright is None:
                self._playwright = await async_playwright().start()
            if self._browser is None or not self._browser.is_connected():
                self._browser = await self._playwright.chromium.launch(
                    headless=config.BROWSER_HEADLESS,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-infobars',
                        '--window-size=1440,900',
                        '--start-maximized'
                    ]
                )
            return self._browser

    async def create_context(self, account: Optional[Dict[str, Any]] = None, viewport: Optional[Dict[str, int]] = None) -> Tuple[BrowserContext, Page]:
        browser = await self.get_browser()
        storage_state = None
        
        if account and account.get('encryptedSession'):
            session_data = decrypt_session(account.get('encryptedSession'))
            platform = account.get('platform', 'zhihu')
            domain_map = {
                'zhihu': '.zhihu.com',
                'xiaohongshu': '.xiaohongshu.com',
                'douyin': '.douyin.com',
                'kuaishou': '.kuaishou.com',
                'weibo': '.weibo.com',
                'bilibili': '.bilibili.com',
                'toutiao': '.toutiao.com',
                'wechat_mp': '.qq.com'
            }
            target_domain = domain_map.get(platform, f".{platform}.com")

            if isinstance(session_data, dict):
                if 'cookies' in session_data or 'origins' in session_data:
                    storage_state = session_data
                elif 'storageState' in session_data:
                    storage_state = session_data['storageState']
            elif isinstance(session_data, str):
                # Raw cookie string like "z_c0=2|...; d_c0=..."
                raw_str = session_data.strip()
                if raw_str.startswith('{') or raw_str.startswith('['):
                    try:
                        parsed = json.loads(raw_str)
                        if isinstance(parsed, list):
                            storage_state = {'cookies': parsed, 'origins': []}
                        elif isinstance(parsed, dict):
                            storage_state = parsed
                    except Exception:
                        pass
                if not storage_state and '=' in raw_str:
                    cookie_list = []
                    for item in raw_str.split(';'):
                        if '=' in item:
                            k, v = item.strip().split('=', 1)
                            cookie_list.append({
                                'name': k.strip(),
                                'value': v.strip(),
                                'domain': target_domain,
                                'path': '/'
                            })
                    if cookie_list:
                        storage_state = {'cookies': cookie_list, 'origins': []}

        context_kwargs: Dict[str, Any] = {
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'locale': 'zh-CN',
            'timezone_id': 'Asia/Shanghai',
            'viewport': viewport or {'width': 1440, 'height': 900}
        }
        if storage_state:
            context_kwargs['storage_state'] = storage_state

        context = await browser.new_context(**context_kwargs)
        page = await context.new_page()
        await page.add_init_script(STEALTH_JS)
        return context, page

    async def extract_and_encrypt_session(self, context: BrowserContext) -> str:
        state = await context.storage_state()
        return encrypt_session(state)

    async def save_debug_screenshot(self, page: Page, task_id: str, platform: str) -> str:
        os.makedirs(config.SCREENSHOT_DIR, exist_ok=True)
        filename = f"{task_id}_{platform}_{int(asyncio.get_event_loop().time())}.png"
        filepath = os.path.join(config.SCREENSHOT_DIR, filename)
        try:
            await page.screenshot(path=filepath, full_page=True)
            return filepath
        except Exception:
            return ""

    async def close(self):
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

browser_manager = BrowserManager()
