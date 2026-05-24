from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import users, chat, universities


app = FastAPI(
    title="Univer AI — консультант абитуриентов Кыргызстана",
    description="AI-чатбот + рекомендательная система для поступления в вузы КР",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {
        "service": "Univer AI",
        "status": "ok",
        "docs": "/docs",
        "endpoints": {
            "register": "POST /auth/register",
            "login":    "POST /auth/login",
            "me":       "GET  /auth/me",
            "set_profile":     "PUT /users/{user_id}/profile",
            "chat":            "POST /chat/message",
            "history":         "GET  /chat/history/{user_id}",
            "universities":    "GET  /universities",
            "recommendations": "GET  /recommendations/{user_id}",
        },
    }



app.include_router(users.router)
app.include_router(chat.router)
app.include_router(universities.router)
