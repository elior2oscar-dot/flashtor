param(
  [string]$ProjectRef = "rnfiykzkcwaxwpgnoexx",
  [string]$EnvFile = "supabase/.env.local"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path $EnvFile)) {
  Write-Host "Missing $EnvFile"
  exit 1
}

$dbPassword = $null
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*SUPABASE_DB_PASSWORD=(.*)$') {
    $dbPassword = $matches[1].Trim()
  }
}

if (-not $dbPassword -or $dbPassword -eq "PASTE_DATABASE_PASSWORD_HERE") {
  Write-Host @"
Database not configured yet.

1. Supabase Dashboard -> Project Settings -> Database -> Database password
2. Add to supabase/.env.local:
   SUPABASE_DB_PASSWORD=your_password
3. Run this script again:
   .\scripts\push-db.ps1
"@
  exit 1
}

Write-Host "Linking project $ProjectRef ..."
npx supabase link --project-ref $ProjectRef --password $dbPassword

Write-Host "Pushing migrations..."
npx supabase db push

Write-Host "Done."
