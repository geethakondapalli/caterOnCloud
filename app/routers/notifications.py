import logging
from fastapi import APIRouter, BackgroundTasks,HTTPException
from app.schemas.notifications import (
   EmailAttachment,
   EmailRequest,
   SMSRequest,
   EmailService,
   SMSService
)
import os
router = APIRouter(prefix="/notifications", tags=["notifications"])

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Twilio configuration for SMS
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
logger = logging.getLogger(__name__)

@router.post("/send-email")
async def send_email_endpoint(
    email_request: EmailRequest,
    background_tasks: BackgroundTasks
):
    """
    Send email with optional PDF attachment
    """
    try:
        # Validate email configuration
        if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
            raise HTTPException(
                status_code=500, 
                detail="Email service not configured"
            )

        # Send email in background
        background_tasks.add_task(EmailService.send_email, email_request)
        
        return {
            "success": True,
            "message": "Email is being sent"
        }

    except Exception as e:
        logger.error(f"Email endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-sms")
async def send_sms_endpoint(
    sms_request: SMSRequest,
    background_tasks: BackgroundTasks
):
    """
    Send SMS notification
    """
    try:
        # Validate SMS configuration
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            raise HTTPException(
                status_code=500, 
                detail="SMS service not configured"
            )

        # Send SMS in background
        background_tasks.add_task(SMSService.send_sms, sms_request)
        
        return {
            "success": True,
            "message": "SMS is being sent"
        }

    except Exception as e:
        logger.error(f"SMS endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Alternative endpoint for immediate sending (not background)
@router.post("/send-email-sync")
async def send_email_sync(email_request: EmailRequest):
    """
    Send email synchronously (wait for completion)
    """
    return await EmailService.send_email(email_request)

@router.post("/send-sms-sync")
async def send_sms_sync(sms_request: SMSRequest):
    """
    Send SMS synchronously (wait for completion)
    """
    return await SMSService.send_sms(sms_request)

# Health check endpoints
@router.get("/email/health")
async def email_health_check():
    """
    Check if email service is configured
    """
    configured = bool(EMAIL_ADDRESS and EMAIL_PASSWORD)
    return {
        "service": "email",
        "configured": configured,
        "smtp_server": SMTP_SERVER if configured else None
    }

@router.get("/sms/health")
async def sms_health_check():
    """
    Check if SMS service is configured
    """
    configured = bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)
    return {
        "service": "sms",
        "configured": configured,
        "from_number": TWILIO_PHONE_NUMBER if configured else None
    }