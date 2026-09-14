import os
from typing import Optional, Dict, Any
from .config import config

class BrowserManager:
    """Manages Playwright browser instance, persistent contexts, and screenshots"""

    def __init__(self):
        self.playwright = None
        self.browser = None
        self.is_initialized = False

    async def init(self):
        if self.is_initialized:
            return
        try:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=config.BROWSER_HEADLESS,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled"
                ]
            )
            self.is_initialized = True
        except Exception as e:
            # Playwright browser might not be installed in lightweight container
            self.is_initialized = False
            self.last_error = str(e)

    async def create_context_with_storage(self, storage_state: Optional[Dict[str, Any]] = None):
        if not self.is_initialized:
            await self.init()
        if not self.browser:
            raise RuntimeError("Browser not initialized. Run `playwright install chromium` first.")

        context_kwargs = {
            "viewport": {"width": 1280, "height": 800},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        if storage_state and "cookies" in storage_state:
            context_kwargs["storage_state"] = storage_state

        return await self.browser.new_context(**context_kwargs)

    async def capture_screenshot(self, page, task_id: str) -> Optional[str]:
        os.makedirs(config.SCREENSHOT_DIR, exist_ok=True)
        file_path = os.path.join(config.SCREENSHOT_DIR, f"{task_id}.png")
        try:
            await page.screenshot(path=file_path, full_page=True)
            return file_path
        except Exception:
            return None

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        self.is_initialized = False

browser_manager = BrowserManager()
