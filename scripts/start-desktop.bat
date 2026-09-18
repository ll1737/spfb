@echo off
chcp 65001 >nul
echo ========================================================
echo   Multi-Publish Desk - 启动 Electron 桌面客户端
echo ========================================================
echo.

echo 正在启动 API、Python 3.12 Worker 与 Electron 原生桌面窗口...
call npm run electron:dev
