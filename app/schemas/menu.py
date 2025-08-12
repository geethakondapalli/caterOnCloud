from pydantic import BaseModel,validator,Field
from typing import Annotated, Optional, List, Dict,Any
from datetime import date, datetime
from decimal import Decimal


class ScheduledMenuItemBase(BaseModel):
    catalog_item_id: Optional[int] = None  # Reference to menu_catalog
    item_name: str
    description: Optional[str] = None
    price: Decimal
    category: Optional[str] = None
    is_combo: bool = False
    combo_items: Optional[List[Dict[str, Any]]] = None

class ScheduledMenuBase(BaseModel):
    name: str
    menu_date: date
    items: List[ScheduledMenuItemBase]
    orderlink: Optional[str] = None
    active: bool = True


class ScheduledMenuCreate(ScheduledMenuBase):

    @validator('menu_date')
    def validate_menu_date(cls, v):
        if v < date.today():
            raise ValueError('Menu date cannot be in the past')
        return v

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Menu name cannot be empty')
        return v.strip()
    
    pass

class ScheduledMenuUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[Dict] = None
    menu_date: Optional[date] = None
    orderlink: Optional[str] = None
    active: Optional[bool] = None

class ScheduledMenuResponse(ScheduledMenuBase):
    menu_id: str
    caterer_id: int
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MenuFlyerUpload(BaseModel):
    menu_name: str
    menu_date: date
    flyer_text: str  # Extracted text from image

class MenuCatalogBase(BaseModel):
    item_name: str
    description: Optional[str] = None
    default_price: float
    category: Optional[str] = None

    @validator('default_price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return round(v, 2)

    @validator('item_name')
    def validate_item_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Item name cannot be empty')
        return v.strip()

class MenuCatalogCreate(MenuCatalogBase):
    pass

class MenuCatalogUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    default_price: Optional[Decimal] = None
    category: Optional[str] = None

    @validator('default_price')
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be greater than 0')
        return round(v, 2) if v else v

class MenuCatalogResponse(MenuCatalogBase):
    menu_item_id: int
    
    class Config:
        from_attributes = True

class ComboItem(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")

PriceDecimal = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]

class ComboItemDetail(BaseModel):
    menu_item_id: int
    item_name: str
    default_price: Decimal
    quantity: int

class ComboCreate(BaseModel):
    combo_name: str = Field(..., min_length=1, max_length=100)
    combo_items: List[ComboItem] = Field(..., min_items=1)
    combo_description: Optional[str] = None
    combo_default_price: Optional[PriceDecimal] = None
    combo_category: Optional[str] = Field(None, max_length=50)
    
    @validator('combo_items')
    def validate_combo_items(cls, v):
        if not v:
            raise ValueError('Combo must contain at least one item')
        
        # Check for duplicate menu items
        item_ids = [item.menu_item_id for item in v]
        if len(item_ids) != len(set(item_ids)):
            raise ValueError('Combo cannot contain duplicate items')
        
        return v

class ComboUpdate(BaseModel):
    combo_name: Optional[str] = Field(None, min_length=1, max_length=100)
    combo_items: Optional[List[ComboItem]] = None
    combo_description: Optional[str] = None
    combo_default_price: Optional[PriceDecimal] = None
    combo_category: Optional[str] = Field(None, max_length=50)
    
    @validator('combo_items')
    def validate_combo_items(cls, v):
        if v is not None:
            if not v:
                raise ValueError('Combo must contain at least one item')
            
            # Check for duplicate menu items
            item_ids = [item.menu_item_id for item in v]
            if len(item_ids) != len(set(item_ids)):
                raise ValueError('Combo cannot contain duplicate items')
        
        return v



class ComboResponse(BaseModel):
    combo_id: int
    combo_name: str
    combo_items: List[ComboItemDetail]
    combo_description: Optional[str]
    combo_default_price: Decimal
    combo_category: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_combo: bool = True

    class Config:
        from_attributes = True

class ComboListResponse(BaseModel):
    combo_id: int
    combo_name: str
    combo_description: Optional[str]
    combo_items: List[ComboItemDetail]
    combo_default_price: Decimal
    combo_category: Optional[str]
    item_count: int
    created_at: datetime
    updated_at: datetime
    is_combo: bool = True

    class Config:
        from_attributes = True


class MenuItemResponse(BaseModel):
    menu_item_id: int
    item_name: str
    description: Optional[str]
    default_price: float
    category: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_combo: bool


class ComboCatalogResponse(BaseModel):
    menu_item_id: int
    combo_id: int
    item_name: str
    combo_name: str
    description: Optional[str]
    combo_description: Optional[str]
    default_price: float
    combo_default_price: float
    category: Optional[str]
    combo_category: Optional[str]
    combo_items: List[ComboItemDetail]
    item_count: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_combo: bool