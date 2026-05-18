from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Medicine, User
from .. import schemas
from ..services.openfda_service import search_medicine
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Medicine])
def get_medicines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetch all saved medicines for the current user.
    """
    return db.query(Medicine).filter(Medicine.owner_id == current_user.id).all()

@router.get("/search")
async def get_medicine_info(query: str):
    """
    Search the global database for a specific medicine by name.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    result = await search_medicine(query)
    return result

@router.post("/", response_model=schemas.Medicine, status_code=status.HTTP_201_CREATED)
def add_medicine(
    medicine_data: schemas.MedicineCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Manually add a medicine to the library for the current user.
    """
    new_med = Medicine(**medicine_data.model_dump(), owner_id=current_user.id)
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.put("/{medicine_id}", response_model=schemas.Medicine)
def update_medicine(
    medicine_id: int, 
    medicine_data: schemas.MedicineUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Update a medicine's details (like status, frequency, etc).
    """
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.owner_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    update_data = medicine_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(med, key, value)
            
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Delete a medicine.
    """
    med = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.owner_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    db.delete(med)
    db.commit()
    return None
