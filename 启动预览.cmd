@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\astro\package.json" (
  echo Please run npm ci in this folder first.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  call npm run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo.
echo English: http://127.0.0.1:4321/en/
echo Chinese: http://127.0.0.1:4321/
echo Press Ctrl+C to stop the preview.
echo.
call npm run preview
pause
