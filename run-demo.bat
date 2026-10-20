@echo off
title AICTE FlowGuard - Standalone Demo
echo =========================================================
echo   AICTE FlowGuard - Standalone Presentation Demo
echo =========================================================
echo.
echo Navigating to apps\web...
cd /d "%~dp0apps\web"

if exist node_modules (
    echo Starting Next.js development server on http://localhost:3000 ...
    echo.
    call npx next dev -p 3000
) else (
    echo First-time setup: installing dependencies...
    call npm install
    echo.
    echo Starting Next.js development server on http://localhost:3000 ...
    echo.
    call npx next dev -p 3000
)
pause
