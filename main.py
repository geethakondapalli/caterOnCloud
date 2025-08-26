from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, notifications, users, menu, orders, payments,inquiry,review
from dotenv import load_dotenv
import os
# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyCloudKitchen API",
    description="A comprehensive catering management system",
    version="1.0.0"
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000"
).split(",")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(inquiry.router)
app.include_router(review.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MyCloudKitchen API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)
