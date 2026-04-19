FROM python:3.11-slim

WORKDIR /app/backend

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY backend/ .

# Start the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --access-log