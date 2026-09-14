@echo off
chcp 65001 >nul
echo ========================================================
echo   Multi-Publish Desk - 启动 Electron 桌面客户端
echo ========================================================
echo.

echo [1/3] 正在启动后台服务 (Web & API 3000)...
start "Multi-Publish Web" cmd /k "npm run dev"

echo [2/3] 正在启动 RPA Worker 节点 (8000)...
start "Multi-Publish Worker" cmd /k "call scripts\start-worker.bat"

echo [3/3] 等待服务初始化后调起 Electron 原生桌面窗口...
timeout /t 3 /nobreak >nul
call npm run electron
