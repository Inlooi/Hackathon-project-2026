# Deployment Guide — Univer AI Backend

## Quick start (local)

Prerequisites: Docker Desktop installed.

```bash
# 1. Copy environment template and fill in your Groq API key
cp .env.example .env
# Edit .env and set GROQ_API_KEY=gsk_...

# 2. Build and run with Docker Compose
docker compose up --build

# 3. Open the API
# http://localhost:8000/docs  (Swagger UI)
# http://localhost:8000/      (root health check)
```

## Stop and clean

```bash
docker compose down            # stop containers
docker compose down -v         # also remove volumes (deletes DB!)
```

## Environment variables

| Variable        | Required | Description                                        |
| --------------- | -------- | -------------------------------------------------- |
| `GROQ_API_KEY`  | Yes      | API key from https://console.groq.com              |
| `DATABASE_URL`  | No       | Default: `sqlite:///./data/univer.db`              |
| `PORT`          | No       | Default: `8000`                                    |

## Production deployment (Railway)

The same Dockerfile works on Railway, Render, Fly.io, AWS, GCP, etc.

For Railway specifically:

1. Push code to GitHub
2. Sign up at https://railway.app with GitHub
3. New Project → Deploy from GitHub repo → select repo
4. Set Root Directory to `ai/` (since backend lives in subdirectory)
5. Add `GROQ_API_KEY` to Variables
6. Generate domain in Settings → Networking

## Architecture

```
┌─────────────┐      HTTPS       ┌──────────────────────┐
│   Frontend  │ ───────────────▶ │  Backend (FastAPI)   │
│  (Vercel)   │                  │  Docker container    │
└─────────────┘                  │  - Llama 3.3 via Groq│
                                 │  - SQLite database   │
                                 │  - 61 universities   │
                                 └──────────────────────┘
```

## Troubleshooting

**Container fails to start with "GROQ_API_KEY not set"**
Make sure `.env` file exists and contains a valid key.

**"Address already in use" on port 8000**
Another process is using port 8000. Change the mapping in docker-compose.yml from `"8000:8000"` to `"8001:8000"` and open `localhost:8001`.

**Frontend CORS errors**
The backend has CORS open for all origins by default. Check that frontend points to the correct API URL.
