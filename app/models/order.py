from sqlalchemy import Column, Integer, String, DateTime, Date, JSON, DECIMAL, ForeignKey, Sequence
from sqlalchemy.orm import relationship
from app.database import Base

order_id_seq = Sequence('order_id_seq', start=1001, increment=1)

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer,order_id_seq, primary_key=True, server_default=order_id_seq.next_value())
    menu_id = Column(String, ForeignKey("scheduled_menu.menu_id"), nullable=False)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String)
    customer_address = Column(JSON, nullable=False)
    customer_email = Column(String)
    menu_date = Column(Date, nullable=False)
    order_date = Column(DateTime, nullable=False)
    delivery_date = Column(DateTime)
    items = Column(JSON, nullable=False)
    total = Column(DECIMAL(10,2), nullable=False)
    payment_method = Column(String)
    payment_status = Column(String)
    status = Column(String, nullable=False)  # 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
    special_instructions = Column(String)
    payment_id = Column(Integer, ForeignKey("payments.payment_id"))
    
    # Relationships
    payment = relationship("Payment", back_populates="order")