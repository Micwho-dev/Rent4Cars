@echo off
echo Starting Rent4Cars Local Server...
start cmd /k "npm install && npm run dev"
timeout /t 5 /nobreak > nul
start "" "http://localhost:3000"
