from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User as UserModel
from .. import schemas
from .auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def get_user_profile(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_profile(
    profile_data: schemas.UserUpdate, 
    current_user: UserModel = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check email uniqueness if email is being updated
    if profile_data.email and profile_data.email != current_user.email:
        db_user = db.query(UserModel).filter(UserModel.email == profile_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
            
    db.commit()
    db.refresh(current_user)
    return current_user
