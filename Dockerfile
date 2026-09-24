FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV, audio handling, and ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary local directories for media and temp uploads
RUN mkdir -p audio/enrolled audio/temp photo temp_uploads storage

EXPOSE 7860
EXPOSE 8000

ENV PORT=8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
