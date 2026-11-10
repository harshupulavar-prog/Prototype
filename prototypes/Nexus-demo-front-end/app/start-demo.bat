@echo off
rem Double-click this file to open the demo in your browser.
cd /d "%~dp0"
if not exist node_modules (
  echo First run: downloading what the demo needs. This takes about a minute.
  call npm install
)
echo Starting the demo. Keep this window open while you use it. Close it to stop.
call npm run dev
