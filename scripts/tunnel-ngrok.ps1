param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
  Write-Host "ngrok is not installed."
  Write-Host "Install: winget install ngrok.ngrok"
  Write-Host "Then run: ngrok config add-authtoken YOUR_TOKEN"
  exit 1
}

Write-Host "Starting ngrok tunnel to http://localhost:$Port"
Write-Host "Copy the https forwarding URL into PUBLIC_APP_URL."

ngrok http $Port
