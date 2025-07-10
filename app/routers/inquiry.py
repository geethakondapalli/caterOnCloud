from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.user import CateringInquiry
from app.schemas.inquiry import InquiryCreate, InquiryResponse, InquiryStatusUpdate

router = APIRouter(prefix="/inquiry", tags=["inquiry"])

@router.post("/create_inquiry", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
def create_inquiry(
    inquiry: InquiryCreate,
    db: Session = Depends(get_db)
):
    """Create a new catering inquiry"""
    
    # Convert event_date string to datetime
    try:
        event_date = datetime.fromisoformat(inquiry.event_date.replace('Z', '+00:00'))
    except ValueError:
        try:
            event_date = datetime.strptime(inquiry.event_date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD or ISO format."
            )
    
    # Check if event date is in the future
    if event_date.date() <= datetime.now().date():
        raise HTTPException(
            status_code=400,
            detail="Event date must be in the future"
        )
    
    # Create new inquiry
    db_inquiry = CateringInquiry(
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        event_date=event_date,
        event_type=inquiry.event_type,
        guest_count=inquiry.guest_count,
        message=inquiry.message,
        status="pending"
    )
    
    try:
        db.add(db_inquiry)
        db.commit()
        db.refresh(db_inquiry)
        
        # Here you could add email notification
        # send_inquiry_notification(db_inquiry)
        
        return db_inquiry
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create inquiry. Please try again."
        )

@router.get("/allinquiries", response_model=List[InquiryResponse])
def get_inquiries(
    status_filter: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get inquiries - add authentication later for admin/caterer access"""
    query = db.query(CateringInquiry)
    
    # Filter by status if provided
    if status_filter:
        query = query.filter(CateringInquiry.status == status_filter)
    
    inquiries = query.order_by(
        CateringInquiry.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return inquiries

@router.get("/{inquiry_id}", response_model=InquiryResponse)
def get_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific inquiry by ID"""
    inquiry = db.query(CateringInquiry).filter(CateringInquiry.inquiry_id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    return inquiry

@router.put("/{inquiry_id}/status", response_model=InquiryResponse)
def update_inquiry_status(
    inquiry_id: int,
    status_update: InquiryStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update inquiry status - add admin/caterer authentication later"""
    inquiry = db.query(CateringInquiry).filter(CateringInquiry.inquiry_id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    inquiry.status = status_update.status
    inquiry.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(inquiry)
        return inquiry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update inquiry status")

@router.delete("/{inquiry_id}")
def delete_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db)
):
    """Delete an inquiry - add admin authentication later"""
    inquiry = db.query(CateringInquiry).filter(CateringInquiry.inquiry_id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    try:
        db.delete(inquiry)
        db.commit()
        return {"message": "Inquiry deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete inquiry")

@router.get("/stats/dashboard")
def get_inquiry_stats(db: Session = Depends(get_db)):
    """Get inquiry statistics for dashboard"""
    total_inquiries = db.query(CateringInquiry).count()
    pending_inquiries = db.query(CateringInquiry).filter(CateringInquiry.status == "pending").count()
    confirmed_inquiries = db.query(CateringInquiry).filter(CateringInquiry.status == "confirmed").count()
    
    # Get inquiries by event type
    event_types = db.query(CateringInquiry.event_type, db.func.count(CateringInquiry.inquiry_id)).group_by(CateringInquiry.event_type).all()
    
    return {
        "total_inquiries": total_inquiries,
        "pending_inquiries": pending_inquiries,
        "confirmed_inquiries": confirmed_inquiries,
        "conversion_rate": round((confirmed_inquiries / total_inquiries * 100), 2) if total_inquiries > 0 else 0,
        "event_types": [{"type": et[0], "count": et[1]} for et in event_types]
    }
