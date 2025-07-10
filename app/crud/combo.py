import json
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from fastapi import HTTPException, status,Depends
from app.models.menu import MenuCombo
from app.database import get_db
from app.schemas.menu import ComboCreate, ComboUpdate, ComboResponse, ComboListResponse, ComboItemDetail

class ComboCRUD:
    
    @staticmethod
    def create_combo(combo_data: ComboCreate, db: Session = Depends(get_db) ) -> ComboResponse:
        """Create a new combo item"""
        try:
            # Validate that all menu items exist
            menu_item_ids = [item.menu_item_id for item in combo_data.combo_items]
            
            # Check if menu items exist
            check_items_query = text("""
                SELECT menu_item_id, item_name, default_price 
                FROM menu_catalog 
                WHERE menu_item_id = ANY(:item_ids)
            """)
            
            existing_items = db.execute(
                check_items_query, 
                {"item_ids": menu_item_ids}
            ).fetchall()
            
            if len(existing_items) != len(menu_item_ids):
                existing_ids = [item.menu_item_id for item in existing_items]
                missing_ids = [id for id in menu_item_ids if id not in existing_ids]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu items not found: {missing_ids}"
                )
            
            # Prepare combo items as JSONB
            combo_items_json = [
                {
                    "menu_item_id": item.menu_item_id,
                    "quantity": item.quantity
                }
                for item in combo_data.combo_items
            ]
            
            # Create combo using SQLAlchemy ORM
            db_combo = MenuCombo(
                combo_name=combo_data.combo_name,
                combo_items=combo_items_json,
                combo_description=combo_data.combo_description,
                combo_default_price=combo_data.combo_default_price,
                combo_category=combo_data.combo_category
            )
            
            db.add(db_combo)
            db.commit()
            db.refresh(db_combo)
            
            # Return the created combo with detailed information
            return ComboCRUD.get_combo_by_id(db_combo.combo_id,db)
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create combo: {str(e)}"
            )
    
    @staticmethod
    def get_combo_by_id(combo_id: int,db: Session = Depends(get_db)) -> ComboResponse:
        """Get a combo by ID with detailed item information"""
        try:
            # Get the combo
            db_combo = db.query(MenuCombo).filter(MenuCombo.combo_id == combo_id).first()
            
            if not db_combo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Combo with ID {combo_id} not found"
                )
            
            # Get detailed item information
            query = text("""
            SELECT 
                (item->>'menu_item_id')::int as menu_item_id,
                m.item_name,
                m.default_price,
                (item->>'quantity')::int as quantity
            FROM json_array_elements(:combo_items) AS item
            LEFT JOIN menu_catalog m ON m.menu_item_id = (item->>'menu_item_id')::int
            WHERE m.menu_item_id IS NOT NULL
            ORDER BY (item->>'menu_item_id')::int
        """)
            
            detailed_items = db.execute(
                query, 
                {"combo_items": json.dumps(db_combo.combo_items)}
            ).fetchall()
            
            combo_items = [
                ComboItemDetail(
                    menu_item_id=item.menu_item_id,
                    item_name=item.item_name,
                    default_price=item.default_price,
                    quantity=item.quantity
                )
                for item in detailed_items
            ]
            
            return ComboResponse(
                combo_id=db_combo.combo_id,
                combo_name=db_combo.combo_name,
                combo_items=combo_items,
                combo_description=db_combo.combo_description,
                combo_default_price=db_combo.combo_default_price,
                combo_category=db_combo.combo_category,
                created_at=db_combo.created_at,
                updated_at=db_combo.updated_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve combo: {str(e)}"
            )
    
    @staticmethod
    def get_all_combos(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ComboListResponse]:
        """Get all combos with optional filtering"""
        try:
            query = db.query(MenuCombo)
            
            # Apply filters
            if category:
                query = query.filter(MenuCombo.combo_category == category)
            
            if search:
                query = query.filter(MenuCombo.combo_name.ilike(f"%{search}%"))
            
            # Apply pagination and ordering
            combos = query.order_by(MenuCombo.created_at.desc()).offset(skip).limit(limit).all()
            
            # Convert to response models
            result = []
            for combo in combos:
                item_count = len(combo.combo_items) if combo.combo_items else 0
                # Get detailed item information
                query = text("""
                SELECT 
                    (item->>'menu_item_id')::int as menu_item_id,
                    m.item_name,
                    m.default_price,
                    (item->>'quantity')::int as quantity
                FROM json_array_elements(:combo_items) AS item
                LEFT JOIN menu_catalog m ON m.menu_item_id = (item->>'menu_item_id')::int
                WHERE m.menu_item_id IS NOT NULL
                ORDER BY (item->>'menu_item_id')::int
            """)
            
                detailed_items = db.execute(
                    query, 
                    {"combo_items": json.dumps(combo.combo_items)}
                ).fetchall()
            
                combo_items = [
                ComboItemDetail(
                    menu_item_id=item.menu_item_id,
                    item_name=item.item_name,
                    default_price=item.default_price,
                    quantity=item.quantity
                )
                    for item in detailed_items
                ]
                
                result.append(ComboListResponse(
                    combo_id=combo.combo_id,
                    combo_name=combo.combo_name,
                    combo_description=combo.combo_description,
                    combo_items=combo_items,
                    combo_default_price=combo.combo_default_price,
                    combo_category=combo.combo_category,
                    item_count=item_count,
                    created_at=combo.created_at,
                    updated_at=combo.updated_at
                ))
        
            return result
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve combos: {str(e)}"
            )
    
    @staticmethod
    def update_combo(combo_id: int, combo_data: ComboUpdate,db: Session = Depends(get_db) ) -> ComboResponse:
        """Update an existing combo"""
        try:
            # Get existing combo
            db_combo = db.query(MenuCombo).filter(MenuCombo.combo_id == combo_id).first()
            
            if not db_combo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Combo with ID {combo_id} not found"
                )
            
            # Validate combo items if provided
            if combo_data.combo_items is not None:
                menu_item_ids = [item.menu_item_id for item in combo_data.combo_items]
                
                check_items_query = text("""
                    SELECT menu_item_id FROM menu_catalog 
                    WHERE menu_item_id = ANY(:item_ids)
                """)
                
                existing_items = db.execute(
                    check_items_query, 
                    {"item_ids": menu_item_ids}
                ).fetchall()
                
                if len(existing_items) != len(menu_item_ids):
                    existing_ids = [item.menu_item_id for item in existing_items]
                    missing_ids = [id for id in menu_item_ids if id not in existing_ids]
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Menu items not found: {missing_ids}"
                    )
            
            # Update fields
            update_data = combo_data.dict(exclude_unset=True)
            
            if 'combo_items' in update_data:
                # Convert combo items to JSONB format
                combo_items_json = [
                    {
                        "menu_item_id": item.menu_item_id,
                        "quantity": item.quantity
                    }
                    for item in combo_data.combo_items
                ]
                update_data['combo_items'] = combo_items_json
            
            # Apply updates
            for field, value in update_data.items():
                setattr(db_combo, field, value)
            
            db.commit()
            db.refresh(db_combo)
            
            # Return updated combo
            return ComboCRUD.get_combo_by_id(db_combo.combo_id,db)
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update combo: {str(e)}"
            )
    
    @staticmethod
    def delete_combo(combo_id: int,db: Session = Depends(get_db)) -> bool:
        """Delete a combo by ID"""
        try:
            # Get combo
            db_combo = db.query(MenuCombo).filter(MenuCombo.combo_id == combo_id).first()
            
            if not db_combo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Combo with ID {combo_id} not found"
                )
            
            # Delete the combo
            db.delete(db_combo)
            db.commit()
            
            return True
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete combo: {str(e)}"
            )
    
    @staticmethod
    def get_combo_categories(db: Session = Depends(get_db)) -> List[str]:
        """Get all unique combo categories"""
        try:
            categories = db.query(MenuCombo.combo_category)\
                        .filter(MenuCombo.combo_category.isnot(None))\
                        .distinct()\
                        .order_by(MenuCombo.combo_category)\
                        .all()
            
            return [category[0] for category in categories]
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve combo categories: {str(e)}"
            )
