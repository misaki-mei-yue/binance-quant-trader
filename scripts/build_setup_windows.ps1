# Compile Inno Setup -> dist\BinanceQuantSetup.exe
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# Ensure launcher exe exists
if (-not (Test-Path "dist\BinanceQuantLauncher.exe")) {
  Write-Host "Building launcher first..."
  powershell -ExecutionPolicy Bypass -File .\scripts\build_launcher_windows.ps1
}

$iscc = @(
  "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
  "${env:LOCALAPPDATA}\Programs\Inno Setup 6\ISCC.exe",
  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $iscc) {
  Write-Host "Inno Setup not found; downloading portable ISCC via choco if available..."
  choco install innosetup -y --no-progress
  $iscc = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
}

& $iscc "installer\installer.iss"
Write-Host "Setup built:"
Get-ChildItem dist -Filter "BinanceQuantSetup*.exe"
