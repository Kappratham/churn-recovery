FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory into a 'backend' folder in the container
# This preserves the relative imports (from . import crud, etc.)
COPY backend/ ./backend/

# Set environment variable for Python path
ENV PYTHONPATH=/app

# Start the application
# We use the shell form of CMD to allow $PORT expansion
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}