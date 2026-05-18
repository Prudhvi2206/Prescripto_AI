import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Prescription, Medicine, User
from .. import schemas
from .auth import get_current_user
from ..services.ai_service import interpret_prescription

router = APIRouter()

@router.post("/scan", response_model=schemas.Prescription, status_code=status.HTTP_201_CREATED)
async def scan_prescription(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    # Fast Single-Pass AI Vision Interpretation
    ai_summary_json = await interpret_prescription(content)
    ai_data = json.loads(ai_summary_json)
    
    raw_text = ai_data.get("extracted_text", "Auto-extracted from image.")
    
    # Save prescription record
    db_prescription = Prescription(
        title=file.filename or "Untitled Prescription",
        extracted_text=raw_text,
        ai_summary=ai_summary_json,
        doctor_name=ai_data.get("doctor_name"),
        patient_name=ai_data.get("patient_name"),
        hospital_name=ai_data.get("hospital_name"),
        owner_id=current_user.id
    )
    db.add(db_prescription)
    
    # Automatically save medicines to the library
    for med in ai_data.get("medicines", []):
        new_med = Medicine(
            name=med["name"],
            generic_name=med.get("generic_name", "Unknown"),
            dosage=med.get("dosage", "As prescribed"),
            timing=med.get("timing", "As prescribed"),
            verified=med.get("verified", False),
            warning=med.get("warnings", ""),
            owner_id=current_user.id
        )
        db.add(new_med)

    db.commit()
    db.refresh(db_prescription)
    
    return db_prescription

@router.get("/", response_model=List[schemas.Prescription])
def get_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Prescription).filter(Prescription.owner_id == current_user.id).all()
