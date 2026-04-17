# WebGIS Fasilitas

Aplikasi WebGIS fullstack untuk memetakan fasilitas umum. Terdiri dari antarmuka React (frontend) dan API FastAPI dengan integrasi PostGIS (backend). Aplikasi ini dikembangkan sebagai pemenuhan **Tugas Praktikum 8 - SIG**.

![Gambar Pratinjau WebGIS](https://img.shields.io/badge/WebGIS-React%20%2B%20Leaflet-6366f1) ![FastAPI](https://img.shields.io/badge/API-FastAPI-009688) ![PostGIS](https://img.shields.io/badge/Database-PostgreSQL%2FPostGIS-336791)

## 🌟 Fitur Utama
* **Frontend Interaktif (React & Leaflet):** Menampilkan peta *fullscreen* menggunakan CartoDB Dark Matter.
* **Integrasi Data GeoJSON:** Memuat titik data fasilitas secara langsung (real-time) melalui fetch API FastAPI.
* **Popup Informasi Cerdas:** Menampilkan nama, jenis, dan alamat fasilitas saat penanda (marker) diklik.
* **Kategorisasi Warna:** Setiap kategori/jenis fasilitas memiliki pewarnaan markernya masing-masing secara dinamis (Custom SVG & style warna).
* **Interaksi Hover & Animasi:** Efek *scale up*, *glow*, serta transisi *glassmorphism* di berbagai elemen UI seperti Legend (Legenda Peta).
* **Fly To Location:** Animasi pemusatan ke titik koordinat saat sebuah marker diklik.

## 📂 Struktur Repositori

```text
webgis-api/
├── main.py                # Entry point aplikasi FastAPI & konfigurasi CORS
├── models.py              # Definisi Pydantic schema
├── Database.py            # Konfigurasi koneksi asyncpg ke PostgreSQL
├── routers/
│   └── fasilitas.py       # Semua endpoint API (GET, POST, dll dan GeoJSON format)
└── frontend/              # Proyek WebGIS visualisasi (React + Vite)
    ├── package.json       # Manifes NPM dan dependensi Frontend
    └── src/
        ├── App.jsx        # Komponen utama & data fetching logic
        ├── index.css      # Custom styling dark theme (CSS Murni)
        └── components/
            ├── MapView.jsx  # Peta Leaflet, logic marker, popup, efek hover
            └── Legend.jsx   # Pembuatan Legenda warna
```

## 🚀 Panduan Eksekusi Luring (Local Run)

Aplikasi ini beroperasi menggunakan dua server yang berbeda (Dua terminal). Pastikan database PostgreSQL (PostGIS) Anda dalam kondisi sedang berjalan.

### 1. Menjalankan Komponen Backend (API RESTful)
Backend beroperasi menggunakan FastAPI di port **8000**.
Buka terminal dan jalankan:
```bash
# Pindah ke sub-direktori backend
cd webgis-api

# Aktivasi Virtual Environment (Bila di windows)
.\.venv\Scripts\activate

# Menjalankan server menggunakan uvicorn
uvicorn main:app --reload
```
Akses ke dokumentasi API: `http://localhost:8000/docs`

### 2. Menjalankan Komponen Frontend (GUI)
Frontend beroperasi menggunakan environment React-Vite di port **5173**.
Buka terminal baru (*instance* terminal kedua):
```bash
# Pindah ke frontend layer
cd webgis-api/frontend

# Install semua packet dan modules
npm install

# Menjalankan developer server Vite
npm run dev
```

Beralihlah ke tab peramban di alamat **`http://localhost:5173`** untuk melihat dan berinteraksi dengan peta interaktifnya. 🗺️
