param(
  [string]$EnvFile = "supabase/.env.local"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  $supabaseCmd = "npx supabase"
} else {
  $supabaseCmd = "supabase"
}

if (-not (Test-Path $EnvFile)) {
  Write-Host "Missing $EnvFile"
  Write-Host "Copy supabase/.env.example to supabase/.env.local and fill values."
  exit 1
}

Write-Host "Serving FlashTor Edge Functions..."
Write-Host "Functions base URL (local stack): http://127.0.0.1:54321/functions/v1"
Write-Host "Press Ctrl+C to stop."

if ($supabaseCmd -eq "npx supabase") {
  npx supabase functions serve --env-file $EnvFile
} else {
  supabase functions serve --env-file $EnvFile
}
