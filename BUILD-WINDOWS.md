# Building the Windows .exe

## Prerequisites (install on the Windows 10 machine)

1. **Node.js 20+** — download from https://nodejs.org (LTS version)
2. **Git** (optional) — https://git-scm.com/download/win

## Steps

1. Copy this entire project folder to the Windows machine (USB, network share, etc.)

2. Open **Command Prompt** or **PowerShell**, navigate to the folder:
   ```
   cd "C:\path\to\Miglena Client Portal"
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Build the .exe:
   ```
   npm run build:win
   ```

5. The installer will be at:
   ```
   dist\Architect CRM-Setup-1.0.0.exe
   ```

6. Run the installer — it will install the app and create a shortcut.

## Where data is stored

- Database: `%APPDATA%\ArchitectCRM\architect-crm.db`
- Documents: `%APPDATA%\ArchitectCRM\documents\`
- Backups: `Desktop\Backup\CRM_Backup_YYYY-MM-DD.csv`
