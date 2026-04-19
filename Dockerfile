FROM python:3.11-slim

WORKDIR /app/backend

# Expose port for Railway
EXPOSE 8000

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY backend/ .

# Start the application
CMD python -c "print('About to start uvicorn...'); import uvicorn; print('Uvicorn imported'); uvicorn.run('main:app', host='0.0.0.0', port=8000)"