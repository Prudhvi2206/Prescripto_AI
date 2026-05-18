from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
import logging
from app.database import engine, Base
from app.routes import prescriptions, users, medicines, chat, auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prescripto-ai")

# Initialize database (In production, use Alembic)
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY is not set. AI features will not work.")
    if not os.getenv("JWT_SECRET"):
        logger.warning("JWT_SECRET is not set. Using default secret (UNSAFE for production).")
    logger.info("Prescripto AI API started successfully.")
    yield
    # Shutdown
    logger.info("Prescripto AI API shutting down.")

app = FastAPI(
    title="Prescripto AI",
    description="AI-powered healthcare application API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to Prescripto AI API", "status": "operational"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(prescriptions.router, prefix="/api/v1/prescriptions", tags=["prescriptions"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(medicines.router, prefix="/api/v1/medicines", tags=["medicines"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
