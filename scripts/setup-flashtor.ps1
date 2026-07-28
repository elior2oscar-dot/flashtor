$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "FlashTor setup (migrations + demo data + local stack)"

npm install pg --no-save 2>$null | Out-Null

node scripts/apply-migrations-pg.js
if ($LASTEXITCODE -ne 0) {
  Write-Host @"

Could not apply migrations automatically.

Quick manual fix (one time):
1. Open Supabase -> SQL Editor
2. Paste and run: supabase/apply-all-migrations.sql
3. Run: node scripts/bootstrap-demo-data.js
4. Run: .\scripts\run-local-stack.ps1

"@
  exit 1
}

node scripts/bootstrap-demo-data.js
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Starting local stack..."
& "$PSScriptRoot\run-local-stack.ps1"
