@echo off
chcp 65001 >nul
echo [ZhiYu Go] Starting backend server with D:\Auserproject\zyxm\go...
set GOPROXY=https://goproxy.cn,direct
"D:\Auserproject\zyxm\go\bin\go.exe" run ./cmd/server
