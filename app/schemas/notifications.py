from fastapi import  HTTPException
from pydantic import BaseModel, EmailStr 
from typing import List, Optional
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import base64,os
import smtplib
import ssl
from twilio.rest import Client
import logging

class EmailAttachment(BaseModel):
    filename: str
    content: str  # Base64 encoded content
    type: str = "application/pdf"

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    html: str
    attachments: Optional[List[EmailAttachment]] = []

class SMSRequest(BaseModel):
    to: str
    message: str

class EmailService:
    @staticmethod
    async def send_email(email_data: EmailRequest) -> dict:
        try:
            # Create message container
            SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
            EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
            EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")    

            msg = MIMEMultipart()
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = email_data.to
            msg['Subject'] = email_data.subject
            logger = logging.getLogger(__name__)
            # Add HTML body
            msg.attach(MIMEText(email_data.html, 'html','utf-8'))

            # Add attachments
            for attachment in email_data.attachments:
                # Decode base64 content
                file_data = base64.b64decode(attachment.content)
                
                # Create attachment
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file_data)
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment.filename}'
                )
                msg.attach(part)

            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                server.send_message(msg)

            return {"success": True, "message": "Email sent successfully"}

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

class SMSService:
    @staticmethod
    async def send_sms(sms_data: SMSRequest) -> dict:
        try:
            # Twilio configuration for SMS
            TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
            TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
            TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
            logger = logging.getLogger(__name__)
            # Initialize Twilio client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            # Send SMS
            message = client.messages.create(
                body=sms_data.message,
                from_=TWILIO_PHONE_NUMBER,
                to=sms_data.to
            )

            return {
                "success": True, 
                "message": "SMS sent successfully",
                "message_sid": message.sid
            }

        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")
