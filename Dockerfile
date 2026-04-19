FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY backend/ .

# Start the application
CMD python -c "
import sys
print('Python started', file=sys.stderr)
import fastapi
print('FastAPI imported', file=sys.stderr)
import uvicorn
print('Uvicorn imported', file=sys.stderr)
uvicorn.run('main:app', host='0.0.0.0', port=8000)
"