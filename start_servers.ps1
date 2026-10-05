# SAMHITA AI - Powershell Launch Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SAMHITA AI - Material Standardization & Harmonization  " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "Launching Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python run_backend.py"

Write-Host "Launching Frontend (Vite on http://127.0.0.1:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

Write-Host "`nBoth services are now running!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
