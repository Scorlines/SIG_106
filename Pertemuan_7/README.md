# WebGIS API - Pertemuan 7

WebGIS API adalah REST API yang dibangun dengan FastAPI dan PostGIS untuk manajemen data spasial fasilitas publik. API ini menyediakan berbagai endpoint untuk melakukan operasi CRUD (Create, Read, Update, Delete) dengan kemampuan query spasial geografis.

## Fitur Utama

✨ **Fitur Spasial:**
- Menyimpan dan mengambil data fasilitas dengan koordinat geografis (longitude, latitude)
- Pencarian fasilitas berdasarkan jarak/proximity menggunakan `ST_DWithin`
- Konversi GeoJSON untuk integrasi dengan web mapping libraries
- Perhitungan jarak dalam meter menggunakan `ST_Distance` dengan geography type

🔄 **Operasi CRUD Lengkap:**
- GET semua fasilitas
- GET fasilitas by ID
- POST/INSERT fasilitas baru
- PUT/UPDATE fasilitas
- DELETE fasilitas

🗺️ **Output Format:**
- JSON standar dengan longitude/latitude
- GeoJSON untuk keperluan mapping (Leaflet, Mapbox, dll)

## Struktur Project

```
webgis-api/
├── main.py              # FastAPI application entry point
├── Database.py          # PostgreSQL connection pool management
├── models.py            # Pydantic models untuk validasi data
├── requirements.txt     # Python dependencies
└── routers/
    └── fasilitas.py     # Router untuk endpoint fasilitas
```

## Teknologi yang Digunakan

- **FastAPI** - Web framework Python yang cepat dan modern
- **asyncpg** - Async PostgreSQL client untuk Python
- **Pydantic** - Data validation dan serialization
- **PostGIS** - Extension PostgreSQL untuk query spasial
- **python-dotenv** - Environment variables management

## Instalasi & Setup

### 1. Persiapan Database PostGIS

Pastikan PostgreSQL dan PostGIS sudah terinstall dan aktif, kemudian buat database dan table:

```sql
-- Buat database
CREATE DATABASE webgis_db;

-- Connect ke database
\c webgis_db

-- Enable PostGIS extension
CREATE EXTENSION "postgis";

-- Buat table fasilitas
CREATE TABLE fasilitas (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    jenis VARCHAR(100) NOT NULL,
    alamat TEXT,
    geom GEOMETRY(POINT, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat spatial index untuk optimasi query
CREATE INDEX idx_fasilitas_geom ON fasilitas USING GIST(geom);
```

### 2. Setup Python Virtual Environment

```bash
# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/webgis_db
```

Ganti `username` dan `password` sesuai konfigurasi PostgreSQL Anda.

### 4. Jalankan API Server

```bash
# Development mode dengan auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

API akan berjalan di: **http://localhost:8000**

## API Endpoints

### 1. **GET /api/fasilitas/** - Ambil Semua Fasilitas
Mengambil semua data fasilitas dalam format JSON.

**Query Parameters:** Tidak ada

**Response:**
```json
[
  {
    "id": 1,
    "nama": "ITERA",
    "jenis": "Institusi Pendidikan",
    "alamat": "Jl. Raya Panjang, Lampung",
    "longitude": 105.2545,
    "latitude": -5.3697
  }
]
```

---

### 2. **GET /api/fasilitas/{id}** - Get Fasilitas by ID
Mengambil data fasilitas berdasarkan ID tertentu.

**Path Parameter:**
- `id` (integer) - ID Fasilitas

**Response:**
```json
{
  "id": 1,
  "nama": "ITERA",
  "jenis": "Institusi Pendidikan",
  "alamat": "Jl. Raya Panjang, Lampung",
  "longitude": 105.2545,
  "latitude": -5.3697
}
```

**Error Response (404):**
```json
{"detail": "Fasilitas tidak ditemukan"}
```

---

### 3. **GET /api/fasilitas/geojson** - Ambil Semua Fasilitas dalam Format GeoJSON
Mengambil semua fasilitas dalam format GeoJSON untuk keperluan mapping.

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [105.2545, -5.3697]
      },
      "properties": {
        "id": 1,
        "nama": "ITERA",
        "jenis": "Institusi Pendidikan"
      }
    }
  ]
}
```

---

### 4. **GET /api/fasilitas/nearby** - Cari Fasilitas Terdekat (Proximity Search)
Mencari fasilitas yang berada dalam radius tertentu dari koordinat yang diberikan.

**Query Parameters:**
- `lat` (float, required) - Latitude titik pusat pencarian
- `lon` (float, required) - Longitude titik pusat pencarian
- `radius` (integer, default: 1000) - Radius pencarian dalam meter

**Contoh Request:**
```
GET /api/fasilitas/nearby?lat=-5.3697&lon=105.2545&radius=5000
```

**Response:**
```json
[
  {
    "id": 1,
    "nama": "ITERA",
    "jenis": "Institusi Pendidikan",
    "jarak_m": 250
  },
  {
    "id": 5,
    "nama": "Bandara Radin Intan II",
    "jenis": "Transportasi",
    "jarak_m": 3500
  }
]
```

---

### 5. **POST /api/fasilitas/** - Tambah Fasilitas Baru
Menambahkan fasilitas baru dengan koordinat geografis.

**Request Body:**
```json
{
  "nama": "Rumah Sakit Umum Lampung",
  "jenis": "Kesehatan",
  "alamat": "Jl. Diponegoro, Bandar Lampung",
  "longitude": 105.2650,
  "latitude": -5.3850
}
```

**Validasi:**
- `nama` - Minimal 3 karakter, required
- `jenis` - String, required
- `longitude` - Float, range [-180, 180], required
- `latitude` - Float, range [-90, 90], required
- `alamat` - String optional

**Response (201 Created):**
```json
{
  "id": 10,
  "nama": "Rumah Sakit Umum Lampung",
  "jenis": "Kesehatan",
  "alamat": "Jl. Diponegoro, Bandar Lampung",
  "longitude": 105.2650,
  "latitude": -5.3850
}
```

---

### 6. **PUT /api/fasilitas/{id}** - Update Fasilitas
Mengupdate data fasilitas yang ada.

**Path Parameter:**
- `id` (integer) - ID Fasilitas yang akan diupdate

**Request Body:** (sama seperti POST)
```json
{
  "nama": "Rumah Sakit Umum Lampung - Cabang Tanjung Karang",
  "jenis": "Kesehatan",
  "alamat": "Jl. Diponegoro, Tanjung Karang",
  "longitude": 105.2700,
  "latitude": -5.3900
}
```

**Response:**
```json
{
  "id": 10,
  "nama": "Rumah Sakit Umum Lampung - Cabang Tanjung Karang",
  "jenis": "Kesehatan",
  "alamat": "Jl. Diponegoro, Tanjung Karang",
  "longitude": 105.2700,
  "latitude": -5.3900
}
```

**Error Response (404):**
```json
{"detail": "Fasilitas tidak ditemukan"}
```

---

### 7. **DELETE /api/fasilitas/{id}** - Hapus Fasilitas
Menghapus fasilitas berdasarkan ID.

**Path Parameter:**
- `id` (integer) - ID Fasilitas yang akan dihapus

**Response:** 204 No Content (success)

**Error Response (404):**
```json
{"detail": "Fasilitas tidak ditemukan"}
```

---

## Dokumentasi Interaktif

Setelah API running, akses dokumentasi interaktif Swagger UI:

```
http://localhost:8000/docs
```

Atau dokumentasi ReDoc:

```
http://localhost:8000/redoc
```

## Contoh Penggunaan dengan cURL

### Ambil semua fasilitas
```bash
curl -X GET "http://localhost:8000/api/fasilitas/"
```

### Cari fasilitas terdekat dalam radius 2km
```bash
curl -X GET "http://localhost:8000/api/fasilitas/nearby?lat=-5.3697&lon=105.2545&radius=2000"
```

### Tambah fasilitas baru
```bash
curl -X POST "http://localhost:8000/api/fasilitas/" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Masjid Al-Ikhlas",
    "jenis": "Peribadatan",
    "alamat": "Jl. Soekarno-Hatta, Lampung",
    "longitude": 105.2600,
    "latitude": -5.3700
  }'
```

### Update fasilitas
```bash
curl -X PUT "http://localhost:8000/api/fasilitas/1" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "ITERA - Institut Teknologi Lampung",
    "jenis": "Institusi Pendidikan",
    "alamat": "Jl. Raya Panjang, Bandar Lampung",
    "longitude": 105.2545,
    "latitude": -5.3697
  }'
```

### Hapus fasilitas
```bash
curl -X DELETE "http://localhost:8000/api/fasilitas/1"
```

## Konfigurasi Connection Pool

Connection pool dikonfigurasi di `Database.py` dengan parameter:
- `min_size=5` - Minimum connection yang selalu terbuka
- `max_size=20` - Maximum connection yang bisa dibuka

Untuk development environment, nilai default sudah cukup. Untuk production, sesuaikan berdasarkan traffic.

## Query Spasial yang Digunakan

1. **ST_Point()** - Membuat point geometry dari longitude, latitude
2. **ST_SetSRID()** - Mengatur Spatial Reference System (SRID 4326 = WGS84)
3. **ST_Distance()** - Menghitung jarak antara dua point dalam meter (dengan geography type)
4. **ST_DWithin()** - Mencari geometri yang berada dalam jarak tertentu
5. **ST_X() & ST_Y()** - Ekstrak koordinat X (longitude) dan Y (latitude)
6. **ST_AsGeoJSON()** - Konversi geometry ke format GeoJSON

## Troubleshooting

### 1. Error: "Database tidak terkoneksi"
- Pastikan PostgreSQL sudah running
- Periksa `.env` file dan pastikan DATABASE_URL benar
- Verifikasi username dan password PostgreSQL

### 2. Error: "PostGIS extension tidak ditemukan"
```sql
-- Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### 3. Slow query pada nearby search
- Pastikan spatial index sudah dibuat:
```sql
CREATE INDEX idx_fasilitas_geom ON fasilitas USING GIST(geom);
```

### 4. CORS error saat mengakses dari frontend
Tambahkan CORS middleware di `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Spesifikasi domain production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Development Tips

1. Gunakan Swagger UI (`/docs`) untuk testing endpoint
2. Aktifkan uvicorn dengan flag `--reload` untuk auto-reload saat coding
3. Gunakan environment variables untuk sensitive data (database credentials)
4. Implementasikan authentication/authorization untuk production
5. Tambahkan rate limiting untuk mencegah abuse

## Referensi

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)
- [GeoJSON Specification](https://geojson.org/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)

---

**Created:** Pertemuan 7 - Semester 6 SIG 106
**Last Updated:** 2026
