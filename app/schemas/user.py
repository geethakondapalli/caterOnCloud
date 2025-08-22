from fastapi import Depends, HTTPException
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import re,secrets,smtplib
from fastapi import BackgroundTasks
from requests import Session
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.responses import HTMLResponse


from app.core.config import settings
from app.core.security import (
   
    get_password_hash, 
    generate_salt
)
from app.database import get_db
from app.models.user import User

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    specialties: Optional[Dict] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserCreateEnhanced(UserCreate):
    email: EmailStr  # This automatically validates email format
    
    @validator('email')
    def validate_email(cls, v):
        # Additional email validation if needed
        if not v or len(v) < 5:
            raise ValueError('Email must be at least 5 characters long')
        
        # Check for valid email pattern (additional to EmailStr)
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        
        return v.lower()

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    specialties: Optional[Dict] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    caterer_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Email confirmation functions
def generate_confirmation_token() -> str:
    """Generate a secure random token for email confirmation"""
    return secrets.token_urlsafe(32)

def send_confirmation_email(email: str, token: str, name: str):
    """Send confirmation email to user"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = settings.email_username
        msg['To'] = email
        msg['Subject'] = "Confirm Your Email Address"
        
        # Email body
        confirmation_url = f"{settings.base_url}auth/confirm-email?token={token}"
        
        html_body = f"""
        <html>
            <body>
                <h2>Welcome to Our Platform!</h2>
                <p>Hi {name},</p>
                <p>Thank you for registering with us. Please click the link below to confirm your email address:</p>
                <p><a href="{confirmation_url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirm Email</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>{confirmation_url}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account with us, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Your App Team</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Send email
        server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
        server.starttls()
        server.login(settings.email_username, settings.email_password)
        text = msg.as_string()
        server.sendmail(settings.email_username, email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
    
def register_user(
    user: UserCreateEnhanced, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email validation and confirmation
    """
    
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email.lower()).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Generate password salt and hash
    
    hashed_password = get_password_hash(user.password)
    salt = ""

    # Generate email confirmation token
    confirmation_token = generate_confirmation_token()
    confirmation_expires = datetime.utcnow() + timedelta(hours=24)
    
    # Create new user with pending status
    db_user = User(
        email=user.email.lower(),
        caterer_id=1001,  # Default caterer_id, you can change this logic
        password=hashed_password,
        password_salt=salt,
        name=user.name,
        role=user.role,
        status="pending",  # User starts as pending until email is confirmed
        phone=user.phone,
        address=user.address,
        specialties=user.specialties,
        bio=user.bio,
        email_confirmation_token=confirmation_token,  # Add this field to your User model
        email_confirmation_expires=confirmation_expires,  # Add this field to your User model
        email_confirmed=False,  # Add this field to your User model
        created_at=datetime.utcnow()
    )
    
    try:
        # Save user to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Send confirmation email in background
        background_tasks.add_task(
            send_confirmation_email, 
            user.email.lower(), 
            confirmation_token, 
            user.name
        )
        
        return {
            "message": "User registered successfully. Please check your email to confirm your account.",
            "user_id": db_user.name,
            "email": db_user.email,
            "status": "pending_confirmation"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Error creating user account"
        )

def confirm_email(token: str, db: Session = Depends(get_db)):
    """
    Confirm user email with token
    """
    
    # Find user with this confirmation token
    db_user = db.query(User).filter(
        User.email_confirmation_token == token,
        User.email_confirmation_expires > datetime.utcnow(),
        User.email_confirmed == False
    ).first()
    
    if not db_user:
        error_html = """
            <html><body style="text-align: center; padding: 50px;">
                <h1 style="color: red;">❌ Invalid Link</h1>
                <p>The confirmation link is invalid or expired.Check with Admin</p>
            </body></html>
            """
        return HTMLResponse(content=error_html, status_code=400)
    
    # Update user status
    db_user.email_confirmed = True
    db_user.status = "active"  # Change from pending to active
    db_user.email_confirmation_token = None  # Clear the token
    db_user.email_confirmation_expires = None
    db_user.email_confirmed_at = datetime.utcnow()  # Add this field to track when confirmed
    
    try:
        db.commit()
        login_url = f"{settings.fe_url}login"
        success_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Confirmed</title>
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0f8ff; }}
                    .container {{ max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .success {{ color: #27ae60; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="success">✅ Email Confirmed!</h1>
                    <p>Your email <strong>{db_user.email}</strong> has been successfully confirmed.</p>
                    <p>Your account is now active!</p>
                    <a href={login_url} style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Sign In Now</a>
                </div>
            </body>
            </html>
            """
        return HTMLResponse(content=success_html, status_code=200)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Error confirming email"
        )

def resend_confirmation_email(
    email: str, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Resend confirmation email for users who haven't confirmed yet
    """
    
    # Find unconfirmed user
    db_user = db.query(User).filter(
        User.email == email.lower(),
        User.email_confirmed == False
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found or already confirmed"
        )
    
    # Generate new token and expiry
    new_token = generate_confirmation_token()
    new_expiry = datetime.utcnow() + timedelta(hours=24)
    
    # Update user record
    db_user.email_confirmation_token = new_token
    db_user.email_confirmation_expires = new_expiry
    
    try:
        db.commit()
        
        # Send new confirmation email
        background_tasks.add_task(
            send_confirmation_email, 
            email.lower(), 
            new_token, 
            db_user.name
        )
        
        return {
            "message": "Confirmation email resent. Please check your email."
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Error resending confirmation email"
        )
