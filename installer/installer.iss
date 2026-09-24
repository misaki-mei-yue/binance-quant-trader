; Binance Quant Trader — Inno Setup 6 script
; 在 Windows 上用 ISCC.exe 编译生成 dist\BinanceQuantSetup.exe
; 本仓库的 GitHub Actions (windows-latest) 会自动编译。

#define MyAppName "Binance Quant Trader"
#define MyAppNameCN "币安量化交易套件"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "misaki-mei-yue"
#define MyAppURL "https://github.com/misaki-mei-yue/binance-quant-trader"
#define MyAppExeName "BinanceQuantLauncher.exe"

[Setup]
AppId={{8F3C2A1B-9D4E-4F6A-B2C1-7E5D9A0B3C4D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\BinanceQuantTrader
DefaultGroupName={#MyAppNameCN}
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE
OutputDir=..\dist
OutputBaseFilename=BinanceQuantSetup
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayName={#MyAppNameCN}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加图标:"; Flags: unchecked

[Files]
; 应用源码与 user_data（策略/配置模板）
Source: "..\user_data\*"; DestDir: "{app}\user_data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\launcher\*"; DestDir: "{app}\launcher"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\requirements.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
; 预构建的启动器 exe（由 PyInstaller 在 CI 生成）
Source: "..\dist\BinanceQuantLauncher.exe"; DestDir: "{app}"; Flags: ignoreversion
; 可选：嵌入式 Python 运行时（CI 打包到 dist\python-embed\）
Source: "..\dist\python-embed\*"; DestDir: "{app}\python"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
; 可选：预装 site-packages / venv
Source: "..\dist\venv-win\*"; DestDir: "{app}\.venv"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppNameCN}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\卸载 {#MyAppNameCN}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppNameCN}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "启动 {#MyAppNameCN}"; Flags: nowait postinstall skipifsilent
Filename: "{app}\scripts\first_run_setup.bat"; Description: "首次安装：安装 Python 依赖（如未嵌入）"; Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
  MsgBox('风险提示：本软件基于开源 Freqtrade，默认模拟盘。' + #13#10 +
         '实盘交易可能导致本金损失。不构成投资建议。', mbInformation, MB_OK);
end;
