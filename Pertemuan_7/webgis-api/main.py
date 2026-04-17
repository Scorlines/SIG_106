from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from Database import get_pool, close_pool
from routers import fasilitas

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    print("Database connected")
    yield
    await close_pool()

app = FastAPI(
    title="WebGIS API",
    description="API data spasial PostGIS",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fasilitas.router)

@app.get("/")
async def root():
    return {"message": "WebGIS API aktif", "docs": "/docs"}