from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional

class InquiryCreate(BaseModel):
    name: str
    email: str
    phone: str
    event_date: str  # We'll convert this to datetime in the endpoint
    event_type: str
    guest_count: int
    message: Optional[str] = None
    
    @validator('guest_count')
    def validate_guest_count(cls, v):
        if v < 1:
            raise ValueError('Guest count must be at least 1')
        return v
    
    @validator('event_type')
    def validate_event_type(cls, v):
        valid_types = ['wedding', 'corporate', 'birthday', 'festival', 'other']
        if v.lower() not in valid_types:
            raise ValueError(f'Event type must be one of: {", ".join(valid_types)}')
        return v.lower()
    
    @validator('phone')
    def validate_phone(cls, v):
        # Basic phone validation
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must contain at least 10 digits')
        return v

class InquiryResponse(BaseModel):
    inquiry_id: int
    name: str
    email: str
    phone: str
    event_date: datetime
    event_type: str
    guest_count: int
    message: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InquiryStatusUpdate(BaseModel):
    status: str
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['pending', 'contacted', 'quoted', 'confirmed', 'cancelled']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v