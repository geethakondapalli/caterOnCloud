from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PaymentBase(BaseModel):
    payment_method: Optional[str] = None
    amount: Optional[Decimal] = None
    currency: str = "GBP"

class PaymentCreate(PaymentBase):
    order_id: Optional[int] = None

class PaymentUpdate(BaseModel):
    payment_status: Optional[str] = None
    payment_intent_id: Optional[str] = None
    transaction_id: Optional[str] = None
    gateway_response: Optional[str] = None
    failure_reason: Optional[str] = None

class PaymentResponse(PaymentBase):
    payment_id: Optional[int] = None
    payment_status: Optional[str] = None
    payment_gateway: Optional[str] = None
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaymentResponseWithOrder(PaymentResponse):
    order_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    total: Optional[Decimal] = None


    class Config:
        from_attributes = True