# Dockerfile for Univer AI Backend
# Builds an isolated container with all dependencies for FastAPI + Groq + SQLite

FROM python:3.11-slim

# Working directory inside the container
WORKDIR /app

# System dependencies for lxml (HTML parsing) and other native packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
# (rebuild won't reinstall packages unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure data directory exists for SQLite database
RUN mkdir -p /app/data

# FastAPI default port
EXPOSE 8000

# Health check — Railway/Docker will know if app is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/').read()" || exit 1

# Start command — Uvicorn serves FastAPI on 0.0.0.0 so external traffic can reach it
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
