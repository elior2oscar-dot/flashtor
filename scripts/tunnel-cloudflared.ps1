param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "cloudflared is not installed."
  Write-Host "Install: winget install Cloudflare.cloudflared"
  exit 1
}

Write-Host "Starting Cloudflare tunnel to http://localhost:$Port"
Write-Host "Copy the https://*.trycloudflare.com URL into:"
Write-Host "  - PUBLIC_APP_URL (supabase/.env.local)"
Write-Host "  - redeploy/restart functions after changing PUBLIC_APP_URL"
Write-Host ""
Write-Host "Friends open booking/confirm/cancel links from this public URL."

cloudflared tunnel --url "http://localhost:$Port"
