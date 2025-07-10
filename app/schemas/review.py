from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional

class ReviewCreate(BaseModel):
    name: str
    email: str  # Use str instead of EmailStr if you don't have email-validator installed
    rating: int
    review_text: str
    
    @validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @validator('review_text')
    def validate_review_text(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Review must be at least 10 characters')
        return v.strip()

class ReviewResponse(BaseModel):
    review_id: int
    name: str
    rating: int
    review_text: str
    is_verified: bool
    is_approved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
