from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import CustomerReview
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/review", tags=["review"])

@router.post("/create_review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db)
):
    """Create a new customer review"""
    
    # Check if email already has a review (optional - remove if allowing multiple reviews per email)
    existing_review = db.query(CustomerReview).filter(
        CustomerReview.email == review.email
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=400, 
            detail="A review from this email already exists"
        )
    
    # Create new review
    db_review = CustomerReview(
        name=review.name,
        email=review.email,
        rating=review.rating,
        review_text=review.review_text,
        is_verified=False,  # Can be set to True if you want auto-verification
        is_approved=False   # Set to False if you want manual approval
    )
    
    try:
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create review. Please try again."
        )

@router.get("/getApprovedReviews", response_model=List[ReviewResponse])
def get_approved_reviews(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all approved reviews for public display"""
    reviews = db.query(CustomerReview).filter(
        CustomerReview.is_approved == True
    ).order_by(CustomerReview.created_at.desc()).offset(skip).limit(limit).all()
    
    return reviews

@router.get("/getAllReviews", response_model=List[ReviewResponse])
def get_all_reviews(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all reviews for admin panel - add authentication later"""
    reviews = db.query(CustomerReview).order_by(
        CustomerReview.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return reviews

@router.put("/{review_id}/approve", response_model=ReviewResponse)
def approve_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Approve a review for public display - add admin authentication later"""
    review = db.query(CustomerReview).filter(CustomerReview.review_id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_approved = True
    
    try:
        db.commit()
        db.refresh(review)
        return review
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to approve review")

@router.delete("/{review_id}/delete")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Delete a review - add admin authentication later"""
    review = db.query(CustomerReview).filter(CustomerReview.review_id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    try:
        db.delete(review)
        db.commit()
        return {"message": "Review deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete review")

@router.get("/stats")
def get_review_stats(db: Session = Depends(get_db)):
    """Get review statistics"""
    total_reviews = db.query(CustomerReview).count()
    approved_reviews = db.query(CustomerReview).filter(CustomerReview.is_approved == True).count()
    pending_reviews = db.query(CustomerReview).filter(CustomerReview.is_approved == False).count()
    
    # Calculate average rating
    reviews = db.query(CustomerReview).filter(CustomerReview.is_approved == True).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "total_reviews": total_reviews,
        "approved_reviews": approved_reviews,
        "pending_reviews": pending_reviews,
        "average_rating": round(avg_rating, 1)
    }