param(
  [int]$WebPort = 3000
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Stop-Port {
  param([int]$Port)
  Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "Stopping old processes on ports $WebPort and 8081..."
Stop-Port -Port $WebPort
Stop-Port -Port 8081
Start-Sleep -Seconds 2

Write-Host "Starting web, tunnel, and mobile (new windows)..."
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-web.ps1"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\tunnel-cloudflared.ps1", "-Port", "$WebPort"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-mobile.ps1"

Write-Host @"

FlashTor local stack starting in separate windows.

Web:    http://localhost:$WebPort
Expo:   http://localhost:8081  (Expo Go: exp://YOUR_LAN_IP:8081)

If booking shows business errors, run DB migrations first:
  1) Add SUPABASE_DB_PASSWORD to supabase/.env.local
  2) .\scripts\push-db.ps1
  OR paste supabase/apply-all-migrations.sql in Supabase SQL Editor.

"@
