from sqlalchemy import text
from app.database import engine

def create_sequences_and_tables():
    with engine.connect() as connection:
        # Create sequences
        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS order_id_seq
                START WITH 1001
                INCREMENT BY 1
                MINVALUE 1001
                MAXVALUE 9999
                CYCLE;
        """))
        
        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS payment_id_seq
                START WITH 1001
                INCREMENT BY 1
                MINVALUE 1001
                MAXVALUE 9999
                CYCLE;
        """))

        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS caterer_id_seq
                START WITH 1001
                INCREMENT BY 1
                MINVALUE 1001
                MAXVALUE 999999999
                CYCLE;
        """))
        
        
        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS menu_item_id_seq
                START WITH 1001
                INCREMENT BY 1
                MINVALUE 1001
                MAXVALUE 9999
                CYCLE;
        """))

        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS combo_id_seq
                START WITH 2001
                INCREMENT BY 1
                MINVALUE 2001
                MAXVALUE 9999
                CYCLE;
        """))

        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS customer_reviews_seq
                START WITH 1001
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
        """))

        connection.execute(text("""
            CREATE SEQUENCE IF NOT EXISTS catering_inquiries_seq
            START WITH 1001
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                email VARCHAR NOT NULL UNIQUE,
                caterer_id INTEGER PRIMARY KEY,
                password VARCHAR NOT NULL,
                password_salt VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                phone VARCHAR,
                address VARCHAR,
                specialties JSONB,
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        # Orders table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                order_id INTEGER PRIMARY KEY DEFAULT nextval('order_id_seq'),
                menu_id VARCHAR NOT NULL,
                customer_name VARCHAR NOT NULL,
                customer_phone VARCHAR,
                customer_address JSONB NOT NULL,
                customer_email VARCHAR,
                menu_date DATE NOT NULL,
                order_date TIMESTAMP NOT NULL,
                delivery_date TIMESTAMP,
                items JSONB NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR,
                payment_status VARCHAR,
                status VARCHAR NOT NULL,
                special_instructions VARCHAR,
                payment_id integer,
                FOREIGN KEY (menu_id) REFERENCES scheduled_menu(menu_id),
                CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id),
                CONSTRAINT unique_order_id UNIQUE (order_id,customer_phone)
                
            )
        """))

        # Menu Items table
        connection.execute(text("""
           CREATE TABLE IF NOT EXISTS scheduled_menu(
                menu_id VARCHAR PRIMARY KEY,
                caterer_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                orderlink VARCHAR,
                items JSONB NOT NULL,
                menu_date date NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (caterer_id) REFERENCES users(caterer_id)
            )
        """))
        
        # Payments table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS payments (
                        payment_id INTEGER PRIMARY KEY DEFAULT nextval('payment_id_seq'), -- Sequence for all Payments
                        payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'paypal', 'stripe','banktransfer' etc.
                        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'cancelled'
                        amount DECIMAL(10,2) NOT NULL,
                        currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
                        payment_intent_id varchar(60), -- Stripe Payment Intent Id
                        transaction_id VARCHAR(255), -- Bank tranfer transaction ID
                        payment_gateway VARCHAR(50), -- 'stripe', 'paypal', 'square', etc.
                        gateway_response TEXT, -- JSON response from payment gateway
                        failure_reason TEXT,
                        processed_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        -- Foreign key constraint (assuming you have an orders table)
                        CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
                    )
        """))
        # Menu Catalog Table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS menu_catalog (
                menu_item_id INTEGER PRIMARY KEY DEFAULT nextval('menu_item_id_seq'),
                item_name VARCHAR(100) NOT NULL,
                description TEXT,
                default_price DECIMAL(8,2) NOT NULL,
                category VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )       
        """))    

        # Combo Catalog 
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS menu_combo_catalog (
                combo_id INTEGER PRIMARY KEY DEFAULT nextval('combo_id_seq'),
                combo_name VARCHAR(100) NOT NULL,
                combo_items JSONB NOT NULL,
                combo_description TEXT,
                combo_default_price DECIMAL(8,2) NOT NULL,
                combo_category VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )       
        """))  

        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_reviews (
                review_id INTEGER NOT NULL DEFAULT nextval('customer_reviews_seq'),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT NOT NULL,
                is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                is_approved BOOLEAN NOT NULL DEFAULT FALSE,
                customer_id INTEGER NULL, -- Foreign key to customers table (if exists)
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                -- Primary Key
                CONSTRAINT pk_customer_reviews PRIMARY KEY (review_id),
                
                -- Constraints
                CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
                CONSTRAINT chk_review_text_length CHECK (LENGTH(TRIM(review_text)) >= 10),
                CONSTRAINT chk_name_length CHECK (LENGTH(TRIM(name)) >= 2)
            )   
        """))  

        connection.execute(text("""
        CREATE TABLE IF NOT EXISTS catering_inquiries (
            inquiry_id INTEGER NOT NULL DEFAULT nextval('catering_inquiries_seq'),
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            guest_count INTEGER NOT NULL CHECK (guest_count > 0),
            message TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            caterer_id INTEGER NULL, -- Foreign key to caterers table (if exists)
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            -- Primary Key
            CONSTRAINT pk_catering_inquiries PRIMARY KEY (inquiry_id),
            
            -- Constraints
            CONSTRAINT chk_inquiry_guest_count CHECK (guest_count > 0),
            CONSTRAINT chk_inquiry_event_type CHECK (event_type IN ('wedding', 'corporate', 'birthday', 'festival', 'other')),
            CONSTRAINT chk_inquiry_status CHECK (status IN ('pending', 'contacted', 'quoted', 'confirmed', 'cancelled')),
            CONSTRAINT chk_inquiry_name_length CHECK (LENGTH(TRIM(name)) >= 2),
            CONSTRAINT chk_inquiry_future_date CHECK (event_date > CURRENT_TIMESTAMP)
        )
        """))  


        connection.execute(text("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """))
        
        # Create triggers
        connection.execute(text("""
            CREATE TRIGGER update_customer_reviews_updated_at 
            BEFORE UPDATE ON customer_reviews 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        """))
        
        connection.execute(text("""
            CREATE TRIGGER update_catering_inquiries_updated_at 
            BEFORE UPDATE ON catering_inquiries 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        """))                            
                                    

        
        connection.commit()

if __name__ == "__main__":
    create_sequences_and_tables()
    print("Database sequences and tables created successfully!")

