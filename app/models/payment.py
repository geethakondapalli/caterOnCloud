from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(20), nullable=False, default='pending')
    amount = Column(DECIMAL(10,2), nullable=False)
    currency = Column(String(3), nullable=False, default='GBP')
    payment_intent_id = Column(String(60))
    transaction_id = Column(String(255))
    payment_gateway = Column(String(50))
    gateway_response = Column(Text)
    failure_reason = Column(Text)
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    order = relationship("Order", back_populates="payment")