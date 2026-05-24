from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Message
from app.models.schemas import ChatMessageIn, ChatMessageOut, MessageOut
from app.services import llm_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message", response_model=ChatMessageOut)
def send_message(payload: ChatMessageIn, db: Session = Depends(get_db)):
    """Отправить сообщение боту. Бот помнит всю историю и профиль."""
    user = db.query(User).filter_by(id=payload.user_id).first()
    if not user:
        raise HTTPException(404, "Пользователь не найден. Сначала зарегистрируйся.")

    reply, msg_id = llm_service.send_message(db, payload.user_id, payload.message)
    return ChatMessageOut(reply=reply, message_id=msg_id)


@router.get("/history/{user_id}", response_model=list[MessageOut])
def get_history(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Вся история переписки пользователя с ботом."""
    msgs = (db.query(Message)
              .filter_by(user_id=user_id)
              .order_by(Message.created_at.asc())
              .limit(limit)
              .all())
    return msgs


@router.delete("/history/{user_id}")
def clear_history(user_id: int, db: Session = Depends(get_db)):
    """Очистить историю (если юзер хочет начать заново)."""
    db.query(Message).filter_by(user_id=user_id).delete()
    db.commit()
    return {"status": "cleared"}
