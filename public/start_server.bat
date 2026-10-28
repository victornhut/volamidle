@echo off
chcp 65001 >nul
title Vo Lam Idle - May Chu Localhost
cd /d "%~dp0"

echo ==================================================================
echo              VO LAM IDLE - MAY CHU LOCALHOST                      
echo ==================================================================
echo Dang khoi dong may chu tai http://localhost:8080 ...
echo Ban co the de cua so nay chay ngam de choi game khong bi lag!
echo Nhan Ctrl+C de dung may chu.
echo ==================================================================
echo.

if exist server.exe (
    server.exe 8080
) else (
    powershell -ExecutionPolicy Bypass -File start_server.ps1
)
pause
