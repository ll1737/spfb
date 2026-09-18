@echo off
title Multi-Publish Desk Launcher
cd /d "%~dp0"
echo ======================================================
echo   Starting Multi-Publish Desk (Python Worker + Express + Electron)
echo ======================================================
npm run electron:dev
pause
