import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.email_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(settings.email_host, settings.email_port)
        server.starttls()
        server.login(settings.email_username, settings.email_password)
        text = msg.as_string()
        server.sendmail(settings.email_username, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_order_confirmation(customer_email: str, order_details: dict):
    subject = f"Order Confirmation - Order #{order_details['order_id']}"
    body = f"""
    Dear {order_details['customer_name']},
    
    Thank you for your order! Here are the details:
    
    Order ID: {order_details['order_id']}
    Total: £{order_details['total']}
    Delivery Date: {order_details['delivery_date']}
    
    We'll send you updates as your order is prepared.
    
    Best regards,
    MyCloudKitchen Team
    """
    
    return send_email(customer_email, subject, body)

def send_order_status_update(customer_email: str, order_details: dict, new_status: str):
    subject = f"Order Update - Order #{order_details['order_id']}"
    body = f"""
    Dear {order_details['customer_name']},
    
    Your order status has been updated:
    
    Order ID: {order_details['order_id']}
    New Status: {new_status.title()}
    
    Thank you for choosing MyCloudKitchen!
    
    Best regards,
    MyCloudKitchen Team
    """
    
    return send_email(customer_email, subject, body)