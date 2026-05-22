# DevOps — Hackathon Project 2026

This folder contains infrastructure-as-code for the entire project.

## Structure

```
devops/
├── docker-compose.yml    Master compose file — brings up the full stack
└── README.md             This file
```

Each microservice has its own Dockerfile inside its folder:
- `ai/Dockerfile`        — AI service (FastAPI + Groq + SQLite)
- `backend/Dockerfile`   — main backend (TODO: backend team)
- `frontend/`            — deployed on Vercel, not containerized here

## Quick start

From the repository root:

```bash
docker compose -f devops/docker-compose.yml up --build
```

This builds and starts all services. Stop with `Ctrl+C` or:

```bash
docker compose -f devops/docker-compose.yml down
```

## Service endpoints (local)

| Service   | URL                            | Notes               |
| --------- | ------------------------------ | ------------------- |
| AI API    | http://localhost:8000          | FastAPI Swagger UI  |
| AI docs   | http://localhost:8000/docs     | Interactive testing |
| Backend   | http://localhost:8001          | (when ready)        |
| Frontend  | https://...vercel.app          | Deployed on Vercel  |

## Required environment files

Before running, create these files (copy from `.env.example`):

- `ai/.env`        — must contain `GROQ_API_KEY=gsk_...`
- `backend/.env`   — backend team configures

## Production deployment

The AI service is deployed independently to Railway using `ai/railway.json`.
Backend deployment is managed by the backend team.

## Troubleshooting

**"port is already allocated"**
Another container or local process is using the port. Either stop it, or
change the port mapping in `docker-compose.yml` (e.g. `"8002:8000"`).

**"GROQ_API_KEY not set"**
Make sure `ai/.env` exists and contains a valid Groq key.

**"Cannot connect to Docker daemon"**
Start Docker Desktop. Wait until the whale icon is stable.

## Architecture

```
                 ┌────────────────┐
                 │   Frontend     │
                 │   (Vercel)     │
                 └────────┬───────┘
                          │ HTTPS
              ┌───────────┴───────────┐
              │                       │
       ┌──────▼──────┐         ┌──────▼──────┐
       │   AI API    │         │  Backend    │
       │  (Docker)   │         │  (Docker)   │
       │  port 8000  │         │  port 8001  │
       └──────┬──────┘         └──────┬──────┘
              │                       │
              │   ┌───────────────┐   │
              └──▶│  Postgres /   │◀──┘
                  │  SQLite       │
                  └───────────────┘
```
