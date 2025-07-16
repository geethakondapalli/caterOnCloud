from fastapi import APIRouter, Depends, HTTPException, status,File, UploadFile, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct, text
from typing import List, Optional, Union
from app.database import get_db
from datetime import date
from app.models.menu import ScheduledMenu, MenuCatalog
from app.models.user import User
from app.schemas.menu import (
    ScheduledMenuCreate, 
    ScheduledMenuUpdate, 
    ScheduledMenuResponse,
    MenuCatalogCreate,
    MenuCatalogResponse,
    MenuCatalogUpdate,
    ComboCreate, ComboUpdate,ComboResponse, ComboListResponse, MenuItemResponse, ComboCatalogResponse,ComboItemDetail
)

from app.core.dependencies import get_current_caterer, get_current_user
from app.crud.combo import ComboCRUD
import uuid

router = APIRouter(prefix="/menu", tags=["menu"])

@router.get("/scheduled", response_model=List[ScheduledMenuResponse])
def get_scheduled_menus(
    skip: int = 0,
    limit: int = 100,
    date_filter: Optional[str] = None,  # YYYY-MM-DD
    caterer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    query = db.query(ScheduledMenu)
    
    if date_filter:
        try:
            filter_date = date.fromisoformat(date_filter)
            query = query.filter(ScheduledMenu.menu_date == filter_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if caterer_id:
        query = query.filter(ScheduledMenu.caterer_id == caterer_id)
    
    query = query.filter(ScheduledMenu.active == True)
    query = query.order_by(ScheduledMenu.menu_date.desc())
    
    menus = query.offset(skip).limit(limit).all()
    return menus

@router.get("/scheduled/inactive", response_model=List[ScheduledMenuResponse])
def get_scheduled_menus(
    skip: int = 0,
    limit: int = 100,
    date_filter: Optional[str] = None,  # YYYY-MM-DD
    caterer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    query = db.query(ScheduledMenu)
    
    if date_filter:
        try:
            filter_date = date.fromisoformat(date_filter)
            query = query.filter(ScheduledMenu.menu_date == filter_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if caterer_id:
        query = query.filter(ScheduledMenu.caterer_id == caterer_id)
    
    query = query.filter(ScheduledMenu.active == False)
    query = query.order_by(ScheduledMenu.menu_date.desc())
    
    menus = query.offset(skip).limit(limit).all()
    return menus

@router.get("/scheduled/my", response_model=List[ScheduledMenuResponse])
def get_my_scheduled_menus(
    current_user = Depends(get_current_caterer),
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    menus = db.query(ScheduledMenu).filter(
        ScheduledMenu.caterer_id == current_user.caterer_id
    ).order_by(ScheduledMenu.menu_date.desc()).all()
    
    return menus    

@router.post("/scheduled", response_model=ScheduledMenuResponse)
def create_scheduled_menu(
    menu: ScheduledMenuCreate,
    current_user = Depends(get_current_caterer),
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    # Generate menu ID
    menu_id = ScheduledMenu.generate_menu_id(menu.menu_date, current_user.caterer_id)
    
    # Generate order link
    order_link = f"/order/{menu_id}"
    
    # Convert items to JSON format
    items_json = []
    for item in menu.items:
        item_dict = {
            "catalog_item_id": item.catalog_item_id,
            "item_name": item.item_name,
            "description": item.description,
            "price": float(item.price),
            "category": item.category,
            "is_combo": item.is_combo,
            "combo_items": item.combo_items
        }
        items_json.append(item_dict)
    
    db_menu = ScheduledMenu(
        menu_id=menu_id,
        caterer_id=current_user.caterer_id,
        name=menu.name,
        orderlink=order_link,
        items=items_json,
        menu_date=menu.menu_date,
        active=menu.active
    )
    
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    
    return db_menu

@router.get("/scheduled/{menu_id}", response_model=ScheduledMenuResponse)
def get_scheduled_menu(menu_id: str, db: Session = Depends(get_db)):
    from app.models.menu import ScheduledMenu
    
    menu = db.query(ScheduledMenu).filter(ScheduledMenu.menu_id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Scheduled menu not found")
    
    return menu

@router.put("/scheduled/{menu_id}/status", response_model=ScheduledMenuResponse)
def update_scheduled_menu_status(menu_id: str, 
                                  statusData: ScheduledMenuUpdate,
                                  current_user = Depends(get_current_caterer),
                                  db: Session = Depends(get_db)):
    from app.models.menu import ScheduledMenu
    
    db_menu = db.query(ScheduledMenu).filter(
        ScheduledMenu.menu_id == menu_id,
        ScheduledMenu.caterer_id == current_user.caterer_id
    ).first()
    
    if not db_menu:
        raise HTTPException(status_code=404, detail="Scheduled menu not found")
    if db_menu.active == status:
        raise HTTPException(status_code=400, detail="Menu status is already set to this value")
    else:
        db_menu.active = statusData.active
    # Update status
    db.commit()
    db.refresh(db_menu)
    
    return db_menu

@router.put("/scheduled/{menu_id}", response_model=ScheduledMenuResponse)
def update_scheduled_menu(
    menu_id: str,
    menu_update: ScheduledMenuUpdate,
    current_user = Depends(get_current_caterer),
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    db_menu = db.query(ScheduledMenu).filter(
        ScheduledMenu.menu_id == menu_id,
        ScheduledMenu.caterer_id == current_user.caterer_id
    ).first()
    
    if not db_menu:
        raise HTTPException(status_code=404, detail="Scheduled menu not found")
    
    # Update fields
    for key, value in menu_update.dict(exclude_unset=True).items():
        if key == "items" and value:
            # Convert items to JSON format
            items_json = []
            for item in value:
                item_dict = {
                    "catalog_item_id": item.catalog_item_id,
                    "item_name": item.item_name,
                    "description": item.description,
                    "price": float(item.price),
                    "category": item.category,
                    "is_combo": item.is_combo,
                    "combo_items": item.combo_items
                }
                items_json.append(item_dict)
            setattr(db_menu, key, items_json)
        else:
            setattr(db_menu, key, value)
    
    db.commit()
    db.refresh(db_menu)
    
    return db_menu

@router.post("/scheduled/upload-flyer")
async def upload_menu_flyer(
    file: UploadFile = File(...),
    menu_name: str = None,
    menu_date: str = None,
    current_user = Depends(get_current_caterer)
):
    """Upload and process menu flyer to extract items"""
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    contents = await file.read()
    
    # Here you would integrate with OCR service (like Tesseract, Google Vision API, etc.)
    # For now, we'll return a mock response
    extracted_text = """
    FLAVORS OF INDIA - AN AUTHENTIC KITCHEN
    30-05-2025 Friday Menu
    
    Veg manchuria - £5.00
    Mushroom Biryani - £5.50
    Chicken Drumsticks Grilled (4) - £6.00
    Chicken Dum Biryani - £6.00
    
    Combo Deal 1
    Family pack Mushroom Biryani (Serves 4) - £20.00
    
    Combo Deal 2
    Mushroom Biryani (Serves 2) + 2 Veg manchuria - £20.00
    """
    
    # Parse extracted text to identify menu items
    parsed_items = parse_menu_text(extracted_text)
    
    return {
        "extracted_text": extracted_text,
        "parsed_items": parsed_items,
        "suggested_menu_name": menu_name or "Imported Menu",
        "suggested_date": menu_date or "2025-05-30"
    }

def parse_menu_text(text: str):
    """Parse menu text and extract items with prices"""
    import re
    
    lines = text.strip().split('\n')
    items = []
    current_category = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line contains price (£X.XX format)
        price_match = re.search(r'£\s*(\d+\.?\d*)', line)
        if price_match:
            price = float(price_match.group(1))
            # Extract item name (text before price)
            item_name = re.sub(r'\s*-?\s*£\s*\d+\.?\d*.*$', '', line).strip()
            
            # Determine if it's a combo
            is_combo = 'combo' in line.lower() or 'deal' in line.lower() or 'family pack' in line.lower()
            
            # Determine category
            if 'veg' in item_name.lower() and 'chicken' not in item_name.lower():
                category = 'Vegetarian'
            elif 'chicken' in item_name.lower():
                category = 'Poultry'
            elif 'biryani' in item_name.lower():
                category = 'Main Courses'
            elif 'combo' in line.lower() or 'deal' in line.lower():
                category = 'Combo Deals'
            else:
                category = 'Main Courses'
            
            items.append({
                "item_name": item_name,
                "price": price,
                "category": category,
                "is_combo": is_combo,
                "description": None
            })
        elif line.lower().startswith('combo deal'):
            current_category = 'Combo Deals'
    
    return items

@router.delete("/scheduled/{menu_id}")
def delete_scheduled_menu(
    menu_id: str,
    current_user = Depends(get_current_caterer),
    db: Session = Depends(get_db)
):
    from app.models.menu import ScheduledMenu
    
    db_menu = db.query(ScheduledMenu).filter(
        ScheduledMenu.menu_id == menu_id,
        ScheduledMenu.caterer_id == current_user.caterer_id
    ).first()
    
    if not db_menu:
        raise HTTPException(status_code=404, detail="Scheduled menu not found")
    
    # Soft delete
    db_menu.active = False
    db.commit()
    
    return {"message": "Scheduled menu deleted successfully"}


@router.get("/catalog/menu_items", response_model=List[MenuCatalogResponse])
def get_catalog_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.models.menu import MenuCatalog
    
    query = db.query(MenuCatalog)
    
    # Filter by category if provided
    if category:
        query = query.filter(MenuCatalog.category == category)
    
    # Search in item name and description
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (MenuCatalog.item_name.ilike(search_term)) |
            (MenuCatalog.description.ilike(search_term))
        )
    
    # Order by category and name
    query = query.order_by(MenuCatalog.category, MenuCatalog.item_name)
    
    items = query.offset(skip).limit(limit).all()
    return items

@router.post("/catalog/create_menu_item", response_model=MenuCatalogResponse)
def create_catalog_item(
        catalog_item: MenuCatalogCreate,
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
        ):
    from app.models.menu import MenuCatalog
    
    # Check if item with same name and category already exists
    existing_item = db.query(MenuCatalog).filter(
        MenuCatalog.item_name == catalog_item.item_name,
        MenuCatalog.category == catalog_item.category
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=400,
            detail="Item with this name already exists in this category"
        )
    
    db_catalog_item = MenuCatalog(**catalog_item.dict())
    db.add(db_catalog_item)
    db.commit()
    db.refresh(db_catalog_item)
    
    return db_catalog_item

@router.put("/catalog/menu/{item_id}", response_model=MenuCatalogResponse)
def update_catalog_item(
    item_id: int,
    catalog_item: MenuCatalogUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.menu import MenuCatalog
    
    db_item = db.query(MenuCatalog).filter(MenuCatalog.menu_item_id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu catalog item not found")
    
    # Update only provided fields
    for key, value in catalog_item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    return db_item

@router.delete("/catalog/menu/{item_id}")
def delete_catalog_item(
    item_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.menu import MenuCatalog
    
    db_item = db.query(MenuCatalog).filter(MenuCatalog.menu_item_id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu catalog item not found")
    
    db.delete(db_item)
    db.commit()
    
    return {"message": "Menu catalog item deleted successfully"}

@router.get("/catalog/menu/categories")
def get_catalog_categories(db: Session = Depends(get_db)):
    from app.models.menu import MenuCatalog
    
    categories = db.query(distinct(MenuCatalog.category)).filter(
        MenuCatalog.category.isnot(None)
    ).all()
    
    return [cat[0] for cat in categories if cat[0]]

@router.post("/catalog/createcombo", response_model=ComboResponse, status_code=status.HTTP_201_CREATED)
def create_combo(
    combo_data: ComboCreate,
    db: Session = Depends(get_db)
):
    """Create a new combo item"""
    return ComboCRUD.create_combo(combo_data,db)

@router.get("/catalog/allcombo", response_model=List[ComboListResponse])
def get_all_combos(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by combo name"),
    db: Session = Depends(get_db)
):
    """Get all combo items with optional filtering"""
    return ComboCRUD.get_all_combos(db, skip, limit, category, search)

@router.get("/catalog/combo/{combo_id}", response_model=ComboResponse)
def get_combo(
    combo_id: int,
    db: Session = Depends(get_db)   
):
    """Get a specific combo by ID"""
    return ComboCRUD.get_combo_by_id(combo_id,db)

@router.put("/catalog/combo/{combo_id}", response_model=ComboResponse)
def update_combo(
    combo_id: int,
    combo_data: ComboUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing combo"""
    return ComboCRUD.update_combo(combo_id, combo_data,db)

@router.delete("/catalog/combo/{combo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_combo(
    combo_id: int,
    db: Session = Depends(get_db)
):
    """Delete a combo by ID"""
    ComboCRUD.delete_combo(combo_id,db)
    return {"message": "Combo deleted successfully"}

@router.get("/catalog/combo/catlist", response_model=List[str])
def get_combo_categories(db: Session = Depends(get_db)):
    """Get all unique combo categories"""
    return ComboCRUD.get_combo_categories(db)

@router.get("/catalog/all")
def get_all_catalog_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all catalog items (both regular items and combos)"""
    try:
        # Build WHERE conditions
        where_conditions = []
        params = {"skip": skip, "limit": limit}
        
        if category:
            where_conditions.append("category = :category")
            params["category"] = category
        
        if search:
            where_conditions.append("item_name ILIKE :search")
            params["search"] = f"%{search}%"
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Execute the combined query
        combined_query = text(f"""
            WITH all_items AS (
                -- Regular menu items
                SELECT 
                    menu_item_id,
                    item_name,
                    description,
                    default_price,
                    category,
                    created_at,
                    updated_at,
                    false as is_combo,
                    null::json as combo_items,
                    null as combo_name,
                    null as combo_price,
                    null::int as combo_id,
                    null as combo_description,
                    null as combo_category,
                    0 as item_count
                FROM menu_catalog
                
                UNION ALL
                
                -- Combo items with detailed information
                SELECT 
                    combo_id as menu_item_id,
                    combo_name as item_name,
                    combo_description as description,
                    combo_default_price as default_price,
                    combo_category as category,
                    created_at,
                    updated_at,
                    true as is_combo,
                    -- Get detailed combo items
                    (
                        SELECT json_agg(
                            json_build_object(
                                'menu_item_id', (item->>'menu_item_id')::int,
                                'item_name', m.item_name,
                                'default_price', m.default_price,
                                'quantity', (item->>'quantity')::int
                            )
                        )
                        FROM jsonb_array_elements(c.combo_items) AS item
                        LEFT JOIN menu_catalog m ON m.menu_item_id = (item->>'menu_item_id')::int
                        WHERE m.menu_item_id IS NOT NULL
                    ) as combo_items,
                    combo_name,
                    combo_default_price as combo_price,
                    combo_id,
                    combo_description,
                    combo_category,
                    jsonb_array_length(c.combo_items) as item_count
                FROM menu_combo_catalog c
            )
            SELECT * FROM all_items
            {where_clause}
            ORDER BY created_at DESC
            OFFSET :skip LIMIT :limit
        """)
        
        results = db.execute(combined_query, params).fetchall()
        
        # Convert to list of dictionaries
        items = []
        for row in results:
            item_dict = {
                "menu_item_id": row.menu_item_id,
                "item_name": row.item_name,
                "description": row.description,
                "default_price": float(row.default_price),
                "category": row.category,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "is_combo": row.is_combo
            }
            
            if row.is_combo:
                item_dict.update({
                    "combo_id": row.combo_id,
                    "combo_name": row.combo_name,
                    "combo_description": row.combo_description,
                    "combo_default_price": str(row.combo_price),
                    "combo_category": row.combo_category,
                    "combo_items": row.combo_items if row.combo_items else [],
                    "item_count": row.item_count or 0
                })
            
            items.append(item_dict)
        
        return items
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve catalog items: {str(e)}"
        )