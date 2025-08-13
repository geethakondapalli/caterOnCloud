from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Date, ForeignKey, DECIMAL,Sequence
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.dialects.postgresql import JSONB

order_id_seq = Sequence('order_id_seq', start=1001, increment=1)
menu_item_id_seq = Sequence('menu_item_id_seq', start=1001, increment=1)
combo_id_seq= Sequence('menu_item_id_seq', start=2001, increment=1)

class ScheduledMenu(Base):
    __tablename__ = "scheduled_menu"

    menu_id = Column(String, primary_key=True)
    caterer_id = Column(Integer, ForeignKey("users.caterer_id"), nullable=False)
    name = Column(String, nullable=False)
    orderlink = Column(String)
    items = Column(JSON, nullable=False)
    menu_date = Column(Date, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caterer = relationship("User")
    # Generate menu_id based on date
    @classmethod
    def generate_menu_id(cls, menu_date, caterer_id):
        date_str = menu_date.strftime("%Y%m%d")
        base_id = f"M{date_str}"
        
        # If multiple menus on same date, add suffix
        from sqlalchemy import func as sql_func
        from app.database import SessionLocal
        
        db = SessionLocal()
        try:
            count = db.query(cls).filter(
                cls.menu_id.like(f"{base_id}%"),
                cls.caterer_id == caterer_id
            ).count()
            
            if count == 0:
                return base_id
            else:
                return f"{base_id}_{count + 1}"
        finally:
            db.close()

class MenuCatalog(Base):
    __tablename__ = "menu_catalog"
    menu_item_id = Column(Integer, menu_item_id_seq, primary_key=True, server_default=menu_item_id_seq.next_value())
    item_name = Column(String(100), nullable=False)
    description = Column(Text)
    default_price = Column(DECIMAL(8,2), nullable=False)
    category = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    # Add index for better performance
    __table_args__ = (
        {'extend_existing': True}
    )

class MenuCombo(Base):
    __tablename__ = "menu_combo_catalog"
    
    combo_id = Column(Integer, combo_id_seq, primary_key=True, server_default=combo_id_seq.next_value())
    combo_name = Column(String(100), nullable=False)
    combo_items = Column(JSONB, nullable=False)
    combo_description = Column(Text, nullable=True)
    combo_default_price = Column(DECIMAL(8, 2), nullable=False)
    combo_category = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())