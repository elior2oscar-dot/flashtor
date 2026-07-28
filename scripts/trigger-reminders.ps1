param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$CronSecret = $env:CRON_SECRET
)

$ErrorActionPreference = "Stop"

if (-not $SupabaseUrl) {
  Write-Host "Set SUPABASE_URL or pass -SupabaseUrl"
  exit 1
}

$headers = @{
  "Content-Type" = "application/json"
}

if ($CronSecret) {
  $headers["x-cron-secret"] = $CronSecret
}

$url = "$SupabaseUrl/functions/v1/send-appointment-reminders"
Write-Host "Triggering reminders: $url"

$response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body "{}"
$response | ConvertTo-Json -Depth 6
