@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo [币安量化] 检查 Python / Freqtrade ...
if exist ".venv\Scripts\freqtrade.exe" (
  echo 已找到嵌入式 freqtrade。
  goto :eof
)
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 -m venv .venv
) else (
  where python >nul 2>&1
  if %ERRORLEVEL%==0 (
    python -m venv .venv
  ) else (
    echo 未找到 Python。请安装 Python 3.11+ 后重试，或使用含嵌入运行时的完整安装包。
    pause
    exit /b 1
  )
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
echo 安装完成。可运行 BinanceQuantLauncher.exe
pause
