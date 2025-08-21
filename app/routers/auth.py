from fastapi import BackgroundTasks
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserCreateEnhanced,Token,send_confirmation_email, confirm_email, resend_confirmation_email,register_user
from app.core.security import (
    verify_password, 
    create_access_token,
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])



@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password + user.password_salt, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
async def register_user_endpoint(
    user: UserCreateEnhanced, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return register_user(user, background_tasks, db)

@router.get("/confirm-email")
async def confirm_email_endpoint(
    token: str,
    db: Session = Depends(get_db)
):
    return confirm_email(token, db)

@router.post("/resend-confirmation")
async def resend_confirmation_endpoint(
    email: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return resend_confirmation_email(email, background_tasks, db)