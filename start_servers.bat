@echo off
echo ========================================================
echo   SAMHITA AI - Material Standardization & Harmonization
echo ========================================================
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "SAMHITA AI Backend" cmd /k "python run_backend.py"

echo Starting Frontend (Vite on http://127.0.0.1:5173)...
start "SAMHITA AI Frontend" cmd /k "cd frontend && npm run dev"

echo All services launched!
echo Open your browser at http://localhost:5173
pause
