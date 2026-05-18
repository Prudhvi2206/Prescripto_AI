from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..database import get_db
from ..models import ChatMessage, User
from .. import schemas
from ..services.ai_service import get_chat_response
from .auth import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: str = "English"

class ChatResponse(BaseModel):
    reply: str

@router.get("/", response_model=List[schemas.ChatMessage])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the last 50 messages for the current user.
    """
    return db.query(ChatMessage).filter(ChatMessage.owner_id == current_user.id).order_by(ChatMessage.created_at.desc()).limit(50).all()

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    try:
        # Save user message
        user_msg = ChatMessage(text=request.message, sender="user", owner_id=current_user.id)
        db.add(user_msg)
        
        # Fetch history for context
        history = db.query(ChatMessage).filter(ChatMessage.owner_id == current_user.id).order_by(ChatMessage.created_at.desc()).limit(10).all()
        formatted_history = [{"sender": m.sender, "text": m.text} for m in reversed(history)]
        
        # Get AI response
        reply = await get_chat_response(request.message, request.language, formatted_history)
        
        # Save AI reply
        ai_msg = ChatMessage(text=reply, sender="ai", owner_id=current_user.id)
        db.add(ai_msg)
        
        db.commit()
        return {"reply": reply}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")
