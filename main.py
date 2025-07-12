from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, notifications, users, menu, orders, payments,inquiry,review
from dotenv import load_dotenv
# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyCloudKitchen API",
    description="A comprehensive catering management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "https://distinguished-art.railway.internal",
        "https://frontend-production-6ab1.up.railway.app",
        "https://cateroncloud-production.up.railway.app" # Your production domain
    ],  # Configure this properly for production
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
