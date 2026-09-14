@echo off
chcp 65001 >nul
echo ========================================================
echo   Multi-Publish Desk - 启动 Web 控制台与服务端 (Port 3000)
echo ========================================================
echo.

if not exist node_modules (
    echo [提示] 正在安装 Node.js 依赖...
    call npm install
)

echo [启动] 启动 Express API + Vite 前端管理后台...
npm run dev
pause
