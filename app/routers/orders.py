from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.menu import ScheduledMenu
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderUpdateResponse, OrderResponse
from app.core.dependencies import get_current_user, get_current_caterer

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/create_orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db)
):
    db_order = Order(
        **order.dict(),
        order_date=datetime.utcnow(),
        status="pending",
        payment_status="pending"
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return db_order

@router.get("/getallorders", response_model=List[OrderResponse])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    params: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "caterer":
        # Get orders for caterer's menu items
        query = db.query(Order)

        # Parse params if provided
        if params:
            try:
                import json
                params_dict = json.loads(params)
                
                # Filter by menu_date if provided
                if 'menudate' in params_dict and params_dict['menudate']:
                    from datetime import datetime
                    menudate = params_dict['menudate']
                    
                    # Handle different date formats
                    if isinstance(menudate, str):
                        # Parse date string (assuming YYYY-MM-DD format)
                        menudate = datetime.strptime(menudate, "%Y-%m-%d").date()
                    
                    query = query.filter(Order.menu_date == menudate)
                
                # You can add more filters here if needed
                # if 'status' in params_dict:
                #     query = query.filter(Order.status == params_dict['status'])
                
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                # If params parsing fails, continue without filtering
                print(f"Error parsing params: {e}")
        
        # Apply pagination and execute query
        orders = query.offset(skip).limit(limit).all()
    else:
        # For admin or customer, get all orders
        orders = []
    
    return orders

@router.get("/getallorders/bymenudate", response_model=List[OrderResponse])
def get_orders_by_menudate(
    skip: int = Query(0, ge=0, description="Number of orders to skip for pagination"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of orders to return"),
    menu_date: str = Query(..., description="Menu date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "caterer":
        # Get orders for caterer's menu items
        query = db.query(Order)

        # Parse params if provided
        if menu_date:
                    parsed_date = datetime.strptime(menu_date, "%Y-%m-%d").date()
                    query = db.query(Order).filter(
                        Order.menu_date == parsed_date  # Ensure caterer only sees their orders
                             )
                
                # You can add more filters here if needed
                # if 'status' in params_dict:
                #     query = query.filter(Order.status == params_dict['status'])
        
        # Apply pagination and execute query
        orders = query.offset(skip).limit(limit).all()
    else:
        # For admin or customer, get all orders
        orders = []
    
    return orders

@router.get("/get/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if user has permission to view this order
    if current_user.role == "caterer":
        scheduled_menu = db.query(ScheduledMenu).filter(ScheduledMenu.menu_date == order.menu_date).first()
        if not scheduled_menu or scheduled_menu.caterer_id != current_user.caterer_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this order")
    
    return order

@router.put("/update/{order_id}", response_model=OrderUpdateResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
     # Authorization check
    if current_user.role == "caterer":
        scheduled_menu = db.query(ScheduledMenu).filter(ScheduledMenu.menu_date == order.menu_date).first()
        if not scheduled_menu or scheduled_menu.caterer_id != current_user.caterer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this order")
    elif current_user.role == "customer":
        # Customers can only view their own orders, not update them
        if order.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this order")
        # Additional restriction: customers might not be allowed to update orders at all
        raise HTTPException(status_code=403, detail="Customers cannot update order status")
    
    # Validate status transitions
    if order_update.status:
        if not _is_valid_status_transition(order.status, order_update.status):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {order.status} to {order_update.status}"
            )
    
    # Update the order
    if order_update.status:
        order.status = order_update.status
    
    if order_update.payment_status:
        order.payment_status = order_update.payment_status
    
    # Commit the changes
    try:
        db.commit()
        db.refresh(order)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update order")
    
    return OrderUpdateResponse(
        message="Order updated successfully",
        order_id=order.order_id,
        status=order.status,
        payment_status=order.payment_status
    )

def _is_valid_status_transition(current_status: str, new_status: str) -> bool:
    """
    Validate if the status transition is allowed.
    Order flow: pending -> confirmed -> preparing -> ready for delivery -> delivered
    """
    valid_transitions = {
        "pending": ["confirmed"],
        "confirmed": ["preparing"],
        "preparing": ["ready for delivery"],
        "ready for delivery": ["delivered"],
        "delivered": []  # No further transitions allowed
    }
    
    return new_status in valid_transitions.get(current_status, [])

# Alternative endpoint for batch updates (if needed)
@router.put("/update-batch", response_model=list[OrderUpdateResponse])
def update_multiple_orders(
    order_updates: list[dict],  # [{"order_id": 1, "order_status": "confirmed"}, ...]
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update multiple orders at once.
    Useful for caterers managing multiple orders.
    """
    if current_user.role != "caterer":
        raise HTTPException(status_code=403, detail="Only caterers can batch update orders")
    
    results = []
    
    for update_data in order_updates:
        order_id = update_data.get("order_id")
        order_status = update_data.get("order_status")
        payment_status = update_data.get("payment_status")
        
        try:
            # Create update request
            update_request = OrderUpdateRequest(
                order_status=OrderStatus(order_status) if order_status else None,
                payment_status=PaymentStatus(payment_status) if payment_status else None
            )
            
            # Use the single update function
            result = update_order(order_id, update_request, current_user, db)
            results.append(result)
            
        except Exception as e:
            # Log the error but continue with other orders
            results.append({
                "message": f"Failed to update order {order_id}: {str(e)}",
                "order_id": order_id,
                "order_status": "error",
                "payment_status": "error"
            })
    
    return results

@router.delete("/delete/{order_id}")
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status in ["delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this order")
    
    order.status = "cancelled"
    db.commit()
    
    return {"message": "Order cancelled successfully"}