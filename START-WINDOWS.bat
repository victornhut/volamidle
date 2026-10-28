@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   VO LAM IDLE - LOCAL SERVER
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo Chua tim thay Node.js.
  echo Hay cai Node.js LTS tu https://nodejs.org/ roi chay lai.
  pause
  exit /b 1
)
node server.js
pause
