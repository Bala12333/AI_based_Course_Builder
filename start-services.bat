@echo off
echo Starting AI Course Builder Services...
echo.

echo [1/3] Starting AI Service (Python)...
cd backend\ai-service
start "AI Service" cmd /k "python app.py"
cd ..\..

echo [2/3] Starting API Gateway (Node.js)...
cd backend\api-gateway
start "API Gateway" cmd /k "npm run dev"
cd ..\..

echo [3/3] Starting Frontend (React)...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo All services are starting up...
echo.
echo Services will be available at:
echo - Frontend: http://localhost:3000
echo - API Gateway: http://localhost:5000
echo - AI Service: http://localhost:5001
echo.
echo Press any key to exit this script...
pause >nul
