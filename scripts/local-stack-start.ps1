param(
  [string]$EnvFile = "supabase/.env.local"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Supabase CLI is not installed. See docs/LOCAL_TESTING.md"
  exit 1
}

Write-Host "Starting local Supabase stack (Docker required)..."
supabase start

Write-Host "Applying migrations..."
supabase db reset --no-seed

if (Test-Path $EnvFile) {
  Write-Host "Serving functions with $EnvFile"
  supabase functions serve --env-file $EnvFile
} else {
  Write-Host "No $EnvFile found. Create it from supabase/.env.example"
  Write-Host "Then run: .\scripts\serve-functions.ps1"
}
