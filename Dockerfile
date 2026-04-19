FROM python:3.11-slim

WORKDIR /app

RUN echo 'Docker build started'

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && echo 'Dependencies installed'

COPY backend/ .

RUN echo 'Files copied'

CMD echo 'Starting uvicorn...' && uvicorn main:app --host 0.0.0.0 --port 8000