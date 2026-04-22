"""
Database.py
===========
Manajemen koneksi PostgreSQL menggunakan asyncpg connection pool.
Termasuk auto-create tabel `users` dan `fasilitas` saat aplikasi pertama kali dijalankan.
"""

import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pool = None


async def get_pool():
    """
    Mengembalikan connection pool asyncpg yang sudah diinisialisasi.
    Pool dibuat sekali (singleton) dengan kapasitas 5–20 koneksi.
    """
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
    return pool


async def close_pool():
    """Menutup semua koneksi dalam pool dengan aman."""
    global pool
    if pool:
        await pool.close()
        pool = None


async def create_tables():
    """
    Membuat tabel-tabel yang diperlukan jika belum ada.

    Tabel yang dibuat:
    - `users`     — data pengguna (autentikasi JWT)
    - `fasilitas` — data fasilitas publik dengan kolom geometri PostGIS

    Fungsi ini aman dipanggil berulang kali (idempoten) karena menggunakan
    `CREATE TABLE IF NOT EXISTS`.
    """
    db_pool = await get_pool()
    async with db_pool.acquire() as conn:
        # Aktifkan ekstensi PostGIS (sudah ada tidak masalah)
        await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

        # Tabel pengguna untuk autentikasi
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id               SERIAL PRIMARY KEY,
                username         VARCHAR(50) UNIQUE NOT NULL,
                hashed_password  TEXT NOT NULL,
                created_at       TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Tabel fasilitas publik dengan kolom geometri
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS fasilitas (
                id      SERIAL PRIMARY KEY,
                nama    VARCHAR(100) NOT NULL,
                jenis   VARCHAR(50)  NOT NULL,
                alamat  TEXT,
                geom    GEOMETRY(Point, 4326)
            );
        """)

        # Buat spatial index untuk pencarian geospasial yang cepat
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_fasilitas_geom
            ON fasilitas USING GIST (geom);
        """)

    print("✅ Tabel database siap (users, fasilitas)")