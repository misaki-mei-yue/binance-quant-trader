# Build BinanceQuantLauncher.exe with PyInstaller (run on Windows / GHA windows-latest)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# tkinter is stdlib on official CPython Windows builds
pyinstaller --noconfirm --clean --windowed `
  --name BinanceQuantLauncher `
  --paths . `
  --add-data "user_data;user_data" `
  --add-data "launcher;launcher" `
  launcher/app.py

New-Item -ItemType Directory -Force -Path dist | Out-Null
Copy-Item -Force "dist\BinanceQuantLauncher\BinanceQuantLauncher.exe" "dist\BinanceQuantLauncher.exe" -ErrorAction SilentlyContinue
if (-not (Test-Path "dist\BinanceQuantLauncher.exe")) {
  Copy-Item -Force "dist\BinanceQuantLauncher.exe" "dist\BinanceQuantLauncher.exe" -ErrorAction SilentlyContinue
}
Write-Host "Launcher artifact:"
Get-ChildItem dist -Filter "*.exe"
