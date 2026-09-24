; Binance Quant Trader — Inno Setup 6
; CI: .github/workflows/windows-setup.yml compiles this to dist\BinanceQuantSetup.exe

#define MyAppName "Binance Quant Trader"
#define MyAppNameCN "Binance Quant Trader"
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
InfoBeforeFile=..\installer\BUILD_STATUS.txt
OutputDir=..\dist
OutputBaseFilename=BinanceQuantSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayName={#MyAppNameCN}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "..\user_data\*"; DestDir: "{app}\user_data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\launcher\*"; DestDir: "{app}\launcher"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\requirements.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\BinanceQuantLauncher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\python-embed\*"; DestDir: "{app}\python"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\dist\venv-win\*"; DestDir: "{app}\.venv"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppNameCN}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppNameCN}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppNameCN}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppNameCN}"; Flags: nowait postinstall skipifsilent
Filename: "{app}\scripts\first_run_setup.bat"; Description: "First-run: install Python deps if needed"; Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
  MsgBox('Risk warning: This app is based on open-source Freqtrade and defaults to dry-run simulation.' + #13#10 +
         'Live trading can lose your capital. Not investment advice.', mbInformation, MB_OK);
end;
