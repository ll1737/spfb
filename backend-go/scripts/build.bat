@echo off
chcp 65001 >nul
echo [ZhiYu Go] Building backend binary with D:\Auserproject\zyxm\go...
set GOPROXY=https://goproxy.cn,direct
"D:\Auserproject\zyxm\go\bin\go.exe" build -o bin/server.exe ./cmd/server
if %errorlevel% neq 0 (
    echo [ZhiYu Go] Build failed!
    exit /b %errorlevel%
)
echo [ZhiYu Go] Build successful: bin/server.exe
