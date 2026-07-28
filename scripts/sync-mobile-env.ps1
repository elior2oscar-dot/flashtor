# Sync mobile/.env from web/.env.local (no secrets printed)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$webEnv = Join-Path $root "web\.env.local"
$mobileEnv = Join-Path $root "mobile\.env"

if (-not (Test-Path $webEnv)) {
  Write-Host "Missing web/.env.local"
  exit 1
}

$map = @{}
Get-Content $webEnv | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $map[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$url = $map['NEXT_PUBLIC_SUPABASE_URL']
$key = $map['NEXT_PUBLIC_SUPABASE_ANON_KEY']
$booking = $map['EXPO_PUBLIC_BOOKING_BASE_URL']
if (-not $booking) { $booking = 'http://localhost:3000' }

if (-not $url -or -not $key) {
  Write-Host "web/.env.local must include NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
}

@"
EXPO_PUBLIC_SUPABASE_URL=$url
EXPO_PUBLIC_SUPABASE_ANON_KEY=$key
EXPO_PUBLIC_BOOKING_BASE_URL=$booking
"@ | Set-Content -Encoding utf8 $mobileEnv

Write-Host "Updated mobile/.env (Supabase + booking base URL)."
