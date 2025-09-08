#!/bin/bash

echo "🏃‍♀️ Starting NewBee Running Club - Python Version"
echo "=================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
cd python-backend
pip install -r requirements.txt

# Start backend in background
echo "Starting FastAPI backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd python-frontend
pip install -r requirements.txt

# Start frontend
echo "Starting Streamlit frontend on port 8501..."
echo "🌐 Backend API: http://localhost:8000"
echo "🌐 Frontend App: http://localhost:8501"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"

streamlit run app.py

# Clean up background process
kill $BACKEND_PID