from sqlalchemy import Column, Integer, String, DateTime, Text, JSON,Sequence,Boolean
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime


# Create sequence for caterer_id
caterer_id_seq = Sequence('caterer_id_seq', start=1001, increment=1)
customer_reviews_seq = Sequence('customer_reviews_seq', start=1001, increment=1)
catering_inquiries_seq = Sequence('catering_inquiries_seq', start=1001, increment=1)


class User(Base):
    __tablename__ = "users"

    email = Column(String, unique=True, nullable=False)
    caterer_id = Column(Integer, caterer_id_seq, primary_key=True, server_default=caterer_id_seq.next_value())
    password = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'caterer', 'admin', 'customer'
    status = Column(String, nullable=False)  # 'active', 'inactive', 'pending'
    phone = Column(String)
    address = Column(String)
    specialties = Column(JSON)
    bio = Column(Text)
    email_confirmation_token = Column(String, nullable=True)
    email_confirmation_expires = Column(DateTime, nullable=True)
    email_confirmed = Column(Boolean, default=False)
    email_confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CustomerReview(Base):
    __tablename__ = "customer_reviews"
    
    review_id = Column(Integer,customer_reviews_seq, primary_key=True, index=True,server_default=customer_reviews_seq.next_value())
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    review_text = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)  # Admin approval
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    
class CateringInquiry(Base):
    __tablename__ = "catering_inquiries"
    
    inquiry_id = Column(Integer,catering_inquiries_seq, primary_key=True, index=True, server_default=catering_inquiries_seq.next_value())
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    event_date = Column(DateTime, nullable=False)
    event_type = Column(String(50), nullable=False)  # wedding, corporate, birthday, etc.
    guest_count = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, contacted, quoted, confirmed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)