from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String, index=True)
    phone_number = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    chronic_conditions = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    prescriptions = relationship("Prescription", back_populates="owner")
    medicines = relationship("Medicine", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    extracted_text = Column(String)
    ai_summary = Column(String)
    image_url = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    patient_name = Column(String, nullable=True)
    hospital_name = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="prescriptions")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    generic_name = Column(String, index=True)
    dosage = Column(String)
    timing = Column(String)
    frequency = Column(String, nullable=True, default="Daily")
    notes = Column(String, nullable=True)
    status = Column(String, default="Upcoming", index=True) # Upcoming, Taken, Missed
    reminder_enabled = Column(Boolean, default=False)
    type = Column(String, default="General", index=True)
    warning = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    reminder_time = Column(String, nullable=True) # HH:mm format
    category = Column(String, default="Morning") # Morning, Afternoon, Night
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="medicines")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    sender = Column(String, index=True) # 'user' or 'ai'
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="chat_messages")
