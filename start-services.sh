#!/bin/bash

echo "Starting AI Course Builder Services..."
echo

echo "[1/3] Starting AI Service (Python)..."
cd backend/ai-service
gnome-terminal --title="AI Service" -- bash -c "python app.py; exec bash" &
cd ../..

echo "[2/3] Starting API Gateway (Node.js)..."
cd backend/api-gateway
gnome-terminal --title="API Gateway" -- bash -c "npm run dev; exec bash" &
cd ../..

echo "[3/3] Starting Frontend (React)..."
cd frontend
gnome-terminal --title="Frontend" -- bash -c "npm run dev; exec bash" &
cd ..

echo
echo "All services are starting up..."
echo
echo "Services will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- API Gateway: http://localhost:5000"
echo "- AI Service: http://localhost:5001"
echo
echo "Press Ctrl+C to stop all services..."
wait
