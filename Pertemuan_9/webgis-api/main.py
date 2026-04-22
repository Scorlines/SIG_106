"""
main.py
=======
Entry point aplikasi FastAPI WebGIS.
Menginisialisasi database, mendaftarkan router, dan mengonfigurasi middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from Database import get_pool, close_pool, create_tables
from routers import fasilitas, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle handler — dijalankan saat aplikasi startup dan shutdown.

    Startup:
    - Inisialisasi connection pool asyncpg
    - Buat tabel `users` dan `fasilitas` jika belum ada (idempoten)

    Shutdown:
    - Tutup semua koneksi dalam pool dengan aman
    """
    await get_pool()
    print("🗄️  Database pool terhubung")
    await create_tables()
    yield
    await close_pool()
    print("🗄️  Database pool ditutup")


app = FastAPI(
    title="WebGIS API — Fasilitas Publik",
    description=(
        "API full-stack WebGIS dengan autentikasi JWT dan CRUD fasilitas publik. "
        "\n\n**Autentikasi:** Gunakan `/api/auth/register` untuk mendaftar, "
        "lalu `/api/auth/login` untuk mendapatkan Bearer token. "
        "Sertakan token pada endpoint terproteksi via header "
        "`Authorization: Bearer <token>`."
    ),
    version="2.0.0",
    lifespan=lifespan,
    contact={
        "name": "WebGIS SIG 106",
    },
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Development: izinkan semua origin
    allow_credentials=False,      # Harus False jika allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(fasilitas.router)


# ── Root ───────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    """Endpoint root — health check sederhana."""
    return {
        "message": "WebGIS API aktif 🗺️",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "2.0.0",
    }