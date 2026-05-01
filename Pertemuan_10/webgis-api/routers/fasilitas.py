import json
from fastapi import APIRouter, HTTPException, Query
from Database import get_pool
from models import FasilitasCreate

router = APIRouter(prefix="/api/fasilitas", tags=["Fasilitas"])

# GET ALL
@router.get("/")
async def get_all():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, nama, jenis, alamat,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude
            FROM fasilitas ORDER BY id
        """)
    return [dict(r) for r in rows]

# GET GEOJSON
@router.get("/geojson")
async def get_geojson():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, nama, jenis, alamat, ST_AsGeoJSON(geom) AS geom
            FROM fasilitas
        """)
    features = [{
        "type": "Feature",
        "geometry": json.loads(r["geom"]),
        "properties": {"id": r["id"], "nama": r["nama"], "jenis": r["jenis"], "alamat": r["alamat"]}
    } for r in rows]
    return {"type": "FeatureCollection", "features": features}

# GET NEARBY
@router.get("/nearby")
async def get_nearby(lat: float, lon: float, radius: int = 1000):
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

# GET BY ID
@router.get("/{id}")
async def get_by_id(id: int):
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

# POST
@router.post("/", status_code=201)
async def create(data: FasilitasCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO fasilitas (nama, jenis, alamat, geom)
            VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4,$5), 4326))
            RETURNING id, nama, jenis, alamat,
                      ST_X(geom) AS longitude, ST_Y(geom) AS latitude
        """, data.nama, data.jenis, data.alamat, data.longitude, data.latitude)
    return dict(row)

# PUT
@router.put("/{id}")
async def update(id: int, data: FasilitasCreate):
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

# DELETE
@router.delete("/{id}", status_code=204)
async def delete(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM fasilitas WHERE id=$1", id)
    if int(result.split()[-1]) == 0:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")