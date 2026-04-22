"""
routers/fasilitas.py
=====================
CRUD endpoint untuk data fasilitas publik.

Akses:
- GET  (read)   → terbuka untuk umum, tidak perlu token
- POST, PUT, DELETE → memerlukan JWT Bearer token (login terlebih dahulu)
"""

import json
from fastapi import APIRouter, HTTPException, Depends, Query
from Database import get_pool
from models import FasilitasCreate
from auth_utils import get_current_user

router = APIRouter(prefix="/api/fasilitas", tags=["Fasilitas"])


# ── GET ALL ────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    summary="Ambil semua fasilitas",
    description="Mengembalikan daftar semua fasilitas publik beserta koordinatnya.",
)
async def get_all():
    """
    **GET /api/fasilitas/** — Ambil seluruh data fasilitas.

    Tidak memerlukan autentikasi. Cocok untuk tampilan publik pada peta.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, nama, jenis, alamat,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude
            FROM fasilitas ORDER BY id
        """)
    return [dict(r) for r in rows]


# ── GET GEOJSON ────────────────────────────────────────────────────────────────

@router.get(
    "/geojson",
    summary="Ambil data sebagai GeoJSON FeatureCollection",
    description=(
        "Mengembalikan seluruh fasilitas dalam format GeoJSON standar "
        "yang siap dikonsumsi oleh library peta seperti Leaflet."
    ),
)
async def get_geojson():
    """
    **GET /api/fasilitas/geojson** — Format GeoJSON untuk Leaflet.

    Response:
    ```json
    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": { "type": "Point", "coordinates": [lon, lat] },
          "properties": { "id": 1, "nama": "...", "jenis": "...", "alamat": "..." }
        }
      ]
    }
    ```
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, nama, jenis, alamat, ST_AsGeoJSON(geom) AS geom
            FROM fasilitas
        """)
    features = [{
        "type": "Feature",
        "geometry": json.loads(r["geom"]),
        "properties": {
            "id": r["id"],
            "nama": r["nama"],
            "jenis": r["jenis"],
            "alamat": r["alamat"]
        }
    } for r in rows]
    return {"type": "FeatureCollection", "features": features}


# ── GET NEARBY ─────────────────────────────────────────────────────────────────

@router.get(
    "/nearby",
    summary="Cari fasilitas terdekat",
    description="Mengembalikan fasilitas dalam radius tertentu dari titik koordinat.",
)
async def get_nearby(
    lat: float = Query(..., description="Latitude titik pusat pencarian"),
    lon: float = Query(..., description="Longitude titik pusat pencarian"),
    radius: int = Query(1000, description="Radius pencarian dalam meter (default 1000 m)"),
):
    """
    **GET /api/fasilitas/nearby** — Pencarian fasilitas berdasarkan jarak.

    Menggunakan fungsi PostGIS `ST_DWithin` dengan proyeksi географis (meter),
    diurutkan dari yang paling dekat.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, nama, jenis,
                   ROUND(ST_Distance(geom::geography, ST_Point($1,$2)::geography)::numeric) AS jarak_m
            FROM fasilitas
            WHERE ST_DWithin(geom::geography, ST_Point($1,$2)::geography, $3)
            ORDER BY jarak_m
        """, lon, lat, radius)
    return [dict(r) for r in rows]


# ── GET BY ID ──────────────────────────────────────────────────────────────────

@router.get(
    "/{id}",
    summary="Ambil fasilitas berdasarkan ID",
)
async def get_by_id(id: int):
    """
    **GET /api/fasilitas/{id}** — Detail satu fasilitas berdasarkan ID.

    Mengembalikan `404` jika fasilitas tidak ditemukan.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, nama, jenis, alamat,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude
            FROM fasilitas WHERE id = $1
        """, id)
    if not row:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    return dict(row)


# ── POST ───────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    status_code=201,
    summary="Tambah fasilitas baru",
    description=(
        "Menambahkan fasilitas publik baru ke database. "
        "**Memerlukan autentikasi JWT** — sertakan header `Authorization: Bearer <token>`."
    ),
)
async def create(
    data: FasilitasCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    **POST /api/fasilitas/** — Buat fasilitas baru (Login diperlukan).

    Menerima JSON body dengan field: `nama`, `jenis`, `alamat`, `longitude`, `latitude`.
    Koordinat disimpan sebagai geometri PostGIS SRID 4326.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO fasilitas (nama, jenis, alamat, geom)
            VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4,$5), 4326))
            RETURNING id, nama, jenis, alamat,
                      ST_X(geom) AS longitude, ST_Y(geom) AS latitude
        """, data.nama, data.jenis, data.alamat, data.longitude, data.latitude)
    return dict(row)


# ── PUT ────────────────────────────────────────────────────────────────────────

@router.put(
    "/{id}",
    summary="Perbarui fasilitas",
    description=(
        "Mengganti seluruh data fasilitas berdasarkan ID. "
        "**Memerlukan autentikasi JWT.**"
    ),
)
async def update(
    id: int,
    data: FasilitasCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    **PUT /api/fasilitas/{id}** — Update penuh (replace) satu fasilitas (Login diperlukan).

    Semua field harus dikirim. Gunakan `FasilitasCreate` schema.
    Mengembalikan `404` jika ID tidak ditemukan.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE fasilitas SET nama=$2, jenis=$3, alamat=$4,
                   geom=ST_SetSRID(ST_Point($5,$6), 4326)
            WHERE id=$1
            RETURNING id, nama, jenis, alamat,
                      ST_X(geom) AS longitude, ST_Y(geom) AS latitude
        """, id, data.nama, data.jenis, data.alamat, data.longitude, data.latitude)
    if not row:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    return dict(row)


# ── DELETE ─────────────────────────────────────────────────────────────────────

@router.delete(
    "/{id}",
    status_code=204,
    summary="Hapus fasilitas",
    description=(
        "Menghapus fasilitas berdasarkan ID secara permanen dari database. "
        "**Memerlukan autentikasi JWT.**"
    ),
)
async def delete(
    id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    **DELETE /api/fasilitas/{id}** — Hapus satu fasilitas (Login diperlukan).

    Mengembalikan `204 No Content` jika berhasil, `404` jika ID tidak ditemukan.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM fasilitas WHERE id=$1", id)
    if int(result.split()[-1]) == 0:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")