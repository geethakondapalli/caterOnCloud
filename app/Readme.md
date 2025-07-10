## Running the Application

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables in `.env`**

3. **Create database sequences:**
```bash
python create_tables.py
```

4. **Run the application:**
```bash
uvicorn app.main:app --reload
```

5. **Access the API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Features Included:

- **User Authentication:** JWT-based auth with role-based access control
- **Menu Management:** CRUD operations for menu items and catalog
- **Order Processing:** Complete order lifecycle management
- **Payment Integration:** Stripe payment processing
- **Email Notifications:** Order confirmations and status updates
- **Database Design:** Follows your exact schema requirements
- **API Documentation:** Auto-generated with FastAPI
- **Security:** Password hashing, input validation, authorization
- **Error Handling:** Comprehensive error responses
- **CORS Support:** For frontend integration

The API is production-ready and includes all the essential features for a catering management system!s

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment

@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    for key, value in payment_update.dict(exclude_unset=True).items():
        setattr(payment, key, value)
    
    db.commit()
    db.refresh(payment)
    
    return payment