@echo off
setlocal

cd /d "%~dp0"

echo [Graph Chat] Releasing VRAM used by llama-server...

tasklist /FI "IMAGENAME eq llama-server.exe" | find /I "llama-server.exe" >nul
if errorlevel 1 (
  echo [Graph Chat] No llama-server.exe process is running.
  goto :show_gpu
)

taskkill /IM llama-server.exe /T /F >nul
if errorlevel 1 (
  echo [Graph Chat] Failed to stop llama-server.exe.
  echo.
  pause
  exit /b 1
)

echo [Graph Chat] llama-server.exe has been stopped.
timeout /t 2 /nobreak >nul

:show_gpu
where nvidia-smi >nul 2>nul
if errorlevel 1 (
  echo [Graph Chat] nvidia-smi was not found. VRAM status was not displayed.
  goto :eof
)

echo.
echo [Graph Chat] Current GPU status:
nvidia-smi
echo.
pause
