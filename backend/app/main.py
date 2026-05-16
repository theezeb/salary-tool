from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import employees

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Salary Management Tool",
    description="HR salary management API for 10,000+ employees", 
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://salary-tool.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
