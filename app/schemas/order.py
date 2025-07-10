from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_DELIVERY = "ready for delivery"
    DELIVERED = "delivered"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID_OFFLINE = "paid offline"
    PAID_ONLINE = "paid online"

class OrderBase(BaseModel):
    menu_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: str
    customer_email: Optional[str] = None
    menu_date: date
    delivery_date: Optional[datetime] = None
    items: Dict
    total: Decimal
    payment_method: Optional[str] = None
    special_instructions: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    order_id: int
    order_date: datetime
    payment_status: Optional[str] = None
    status: str
    payment_id: Optional[int] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    delivery_date: Optional[datetime] = None
    special_instructions: Optional[str] = None


class OrderUpdateResponse(BaseModel):
    message: str
    order_id: int
    status: Optional[str] = None
    payment_status: Optional[str] = None
