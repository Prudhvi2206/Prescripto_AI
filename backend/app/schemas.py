from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Prescription Schemas
class PrescriptionBase(BaseModel):
    title: str
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    image_url: Optional[str] = None
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    hospital_name: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class Prescription(PrescriptionBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    dosage: str
    timing: str
    frequency: str = "Daily"
    notes: Optional[str] = None
    status: str = "Upcoming"
    reminder_enabled: bool = False
    type: str = "General"
    warning: Optional[str] = None
    verified: bool = False
    reminder_time: Optional[str] = None
    category: str = "Morning"

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    timing: Optional[str] = None
    frequency: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    status: Optional[str] = None
    type: Optional[str] = None
    warning: Optional[str] = None
    verified: Optional[bool] = None
    reminder_time: Optional[str] = None
    category: Optional[str] = None

class Medicine(MedicineBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    text: str
    sender: str  # 'user' or 'ai'

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
