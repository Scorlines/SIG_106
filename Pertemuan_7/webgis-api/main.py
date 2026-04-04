from fastapi import FastAPI
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

app.include_router(fasilitas.router)

@app.get("/")
async def root():
    return {"message": "WebGIS API aktif", "docs": "/docs"}