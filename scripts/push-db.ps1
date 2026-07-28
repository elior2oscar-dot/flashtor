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
$dbHost = "db.$ProjectRef.supabase.co"
$dbPort = "5432"
$dbName = "postgres"
$dbUser = "postgres"
$databaseUrl = $null

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*SUPABASE_DB_PASSWORD=(.*)$') { $dbPassword = $matches[1].Trim() }
  if ($_ -match '^\s*SUPABASE_DB_HOST=(.*)$') { $dbHost = $matches[1].Trim() }
  if ($_ -match '^\s*SUPABASE_DB_PORT=(.*)$') { $dbPort = $matches[1].Trim() }
  if ($_ -match '^\s*SUPABASE_DB_NAME=(.*)$') { $dbName = $matches[1].Trim() }
  if ($_ -match '^\s*SUPABASE_DB_USER=(.*)$') { $dbUser = $matches[1].Trim() }
  if ($_ -match '^\s*DATABASE_URL=(.*)$') {
    $val = $matches[1].Trim()
    if ($val -and $val -notmatch 'PASTE') { $databaseUrl = $val }
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

# Prefer direct connection (avoids broken `supabase link` on OneDrive/.temp)
if (-not $databaseUrl) {
  $encoded = [uri]::EscapeDataString($dbPassword)
  $databaseUrl = "postgresql://${dbUser}:${encoded}@${dbHost}:${dbPort}/${dbName}"
}

Write-Host "Pushing migrations to $ProjectRef (direct DB URL)..."
npx supabase db push --db-url $databaseUrl --yes
if ($LASTEXITCODE -ne 0) {
  Write-Host "db push failed (exit $LASTEXITCODE)."
  exit $LASTEXITCODE
}

Write-Host "Done."
