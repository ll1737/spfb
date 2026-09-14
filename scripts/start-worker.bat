@echo off
chcp 65001 >nul
echo ========================================================
echo   Multi-Publish Desk - 启动 Python Playwright Worker (Port 8000)
echo ========================================================
echo.

cd services\worker

if not exist venv (
    echo [提示] 正在创建 Python 虚拟环境...
    python -m venv venv
)

echo [提示] 激活虚拟环境并安装 Python 依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt
playwright install chromium

echo [启动] 启动 FastAPI Worker 服务...
python main.py
pause
