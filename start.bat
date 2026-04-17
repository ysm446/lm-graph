@echo off
setlocal

cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=

if not exist "node_modules" (
  echo [LM Graph] Installing npm dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

set "NEEDS_REBUILD="
if not exist "node_modules\better-sqlite3\build\Release\better_sqlite3.node" (
  set "NEEDS_REBUILD=1"
)
if /I "%~1"=="--rebuild" (
  set "NEEDS_REBUILD=1"
)

if defined NEEDS_REBUILD (
  echo [LM Graph] Rebuilding native modules for Electron...
  call npm run rebuild:electron
  if errorlevel 1 goto :fail
) else (
  echo [LM Graph] Skipping native rebuild. Use start.bat --rebuild if needed.
)

echo [LM Graph] Starting app...
call npm run dev
if errorlevel 1 goto :fail

goto :eof

:fail
echo.
echo [LM Graph] Startup failed.
exit /b 1
