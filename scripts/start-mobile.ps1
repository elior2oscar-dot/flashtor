$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..\mobile

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "Created mobile/.env from .env.example - fill Supabase values if needed."
  } else {
    Write-Host "Missing mobile/.env"
    exit 1
  }
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing mobile dependencies..."
  npm install
}

Write-Host "Starting FlashTor owner mobile (Expo)..."
npm run start -- --port 8081 --lan
