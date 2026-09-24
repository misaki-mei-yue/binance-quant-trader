# dist/

此目录存放构建产物：

- `BinanceQuantLauncher.exe` — PyInstaller 启动器
- `BinanceQuantSetup.exe` — Inno Setup 安装包

Linux 开发机通常无法本地编译上述 Windows 二进制；请使用仓库 GitHub Actions
`.github/workflows/windows-setup.yml`（`windows-latest` + Inno Setup）生成，
或在 Windows 上运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_setup_windows.ps1
```
