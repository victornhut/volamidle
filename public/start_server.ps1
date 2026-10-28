# Vo Lam Idle - PowerShell Web Server Runner
$host.UI.RawUI.WindowTitle = "Vo Lam Idle - Local Server"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $PSScriptRoot) { $PSScriptRoot = "e:\FetchJX" }

if (Test-Path "$PSScriptRoot\server.exe") {
    & "$PSScriptRoot\server.exe" 8080
} else {
    Write-Host "Khong tim thay server.exe, dang bien dich lai..." -ForegroundColor Yellow
    & "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:exe /out:"$PSScriptRoot\server.exe" /r:System.Net.Http.dll "$PSScriptRoot\Server.cs"
    & "$PSScriptRoot\server.exe" 8080
}
