param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..\web

if (-not (Test-Path ".env.local")) {
  Write-Host "Missing web/.env.local"
  Write-Host "Copy web/.env.local.example to web/.env.local and fill Supabase values."
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing web dependencies..."
  npm install
}

Write-Host "Starting FlashTor web on http://localhost:$Port"
npm run dev -- -p $Port
