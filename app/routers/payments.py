import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.payment import Payment
from app.models.order import Order
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse,PaymentResponseWithOrder
from app.core.dependencies import get_current_user
import stripe

from app.core.config import settings

stripe.api_key = "sk_test_51RTmiOQMjkOvMvVCRMl7Ke2NeIvBRvmDVUBNB3FSiWPCDq1Cv6joY5sYuVzUKIS1ra3KdP6liqIB4KYV8djjmoDp0005dfNf0O"


router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):
    db_payment = Payment(
        payment_method=payment.payment_method,
        payment_status="pending",
        amount=payment.amount,
        currency=payment.currency,
        payment_gateway="stripe" if payment.payment_method in ["credit_card", "debit_card"] else None
    )
    
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    return db_payment

@router.post("/stripe/create-intent")
def create_payment_intent(
    order_id: int,
    db: Session = Depends(get_db)
):
    stripe.api_key = "sk_test_51RTmiOQMjkOvMvVCRMl7Ke2NeIvBRvmDVUBNB3FSiWPCDq1Cv6joY5sYuVzUKIS1ra3KdP6liqIB4KYV8djjmoDp0005dfNf0O"
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable is not set")
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total * 100),  # Stripe expects amount in cents
            currency=order.currency if hasattr(order, 'currency') else 'gbp',
            metadata={'order_id': order_id}
        )
        
        # Create payment record
        payment = Payment(
            payment_method="stripe",
            payment_status="pending",
            amount=order.total,
            currency="GBP",
            payment_intent_id=intent.id,
            payment_gateway="stripe"
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # Update order with payment_id
        order.payment_id = payment.payment_id
        db.commit()
        
        return {
            "client_secret": intent.client_secret,
            "payment_id": payment.payment_id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stripe/confirm/{payment_id}")
def confirm_payment(
    payment_id: str,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.payment_intent_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    try:
        intent = stripe.PaymentIntent.retrieve(payment.payment_intent_id)
        
        if intent.status == "succeeded":
            payment.payment_status = "completed"
            payment.processed_at = datetime.utcnow()
            payment.gateway_response = str(intent)
            
            # Update order payment status
            order = db.query(Order).filter(Order.payment_id == payment.payment_id).first()
            if order:
                order.payment_status = "completed"
                order.status = "confirmed"
            
            db.commit()
            
        elif intent.status == "payment_failed":
            payment.payment_status = "failed"
            payment.failure_reason = intent.last_payment_error.message if intent.last_payment_error else "Payment failed"
            db.commit()
        
        return {"status": intent.status, "payment_status": payment.payment_status}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    skip: int = 0,
    limit: int = 100,

    db: Session = Depends(get_db)
):
        payments = db.query(Payment).offset(skip).limit(limit).all()
        return payments

@router.get("/{menu_date}/",response_model=List[PaymentResponseWithOrder])
async def get_payments_by_menu_date(
    menu_date:str ,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get payments by menu date with flexible date string input
    """
    try:
        # Parse date string
        parsed_date = datetime.strptime(menu_date, "%Y-%m-%d").date()
        
        # Use the same logic as above
        query = text(f"""
            SELECT 
                p.payment_id,
                p.amount,
                p.currency,
                p.processed_at,
                o.payment_method,
                o.payment_status,
                p.created_at,
                o.order_id,
                o.customer_name,
                o.customer_phone,
                o.customer_address,
                o.menu_date,
                o.total 
            FROM payments p
            RIGHT JOIN orders o ON p.payment_id = o.payment_id
            WHERE o.menu_date = :menu_date
            ORDER BY o.order_date DESC
        """)
        try:
            rows = db.execute(query, {"menu_date": parsed_date})
            
            payments = []
            for row in rows:
                if row.payment_id is not None:
                    payment_dict = {
                        "payment_id": row.payment_id if row.payment_id is not None else None,
                        "amount": float(row.amount),
                        "currency": row.currency,
                        "processed_at": row.processed_at.isoformat() if row.processed_at else None,
                        "payment_method": row.payment_method,
                        "payment_status": row.payment_status,
                        "created_at": row.processed_at.isoformat() if row.processed_at else None,
                        "order_id": row.order_id,
                        "customer_name": row.customer_name,
                        "customer_phone": row.customer_phone,
                        "customer_address": row.customer_address,
                        "menu_date":row.menu_date,
                        "total": float(row.total)

                    }
                else:
                    payment_dict = {
                        "payment_id": None,
                        "amount": float(row.total) if row.total is not None else 0.0,
                        "currency": "GBP",
                        "processed_at": None,
                        "payment_method": row.payment_method,
                        "payment_status": row.payment_status,
                        "created_at": None,
                        "order_id": row.order_id,
                        "customer_name": row.customer_name,
                        "customer_phone": row.customer_phone,
                        "customer_address": row.customer_address,
                        "menu_date": row.menu_date,
                        "total": float(row.total) if row.total is not None else 0.0
                    }

                payments.append(payment_dict)
            
            return payments
            
        finally:
            db.close()
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 