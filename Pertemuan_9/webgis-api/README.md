# Tugas Praktikum 9 - WebGIS Full-Stack (Fasilitas Publik)

Aplikasi WebGIS full-stack untuk mengelola data fasilitas publik (seperti puskesmas, sekolah, rumah sakit, dll) di sebuah wilayah. Dibangun dengan FastApi (Backend) dan React-Leaflet (Frontend).

## Memenuhi Ketentuan Tugas:

1.  **Backend CRUD & Validasi Pydantic:** Implementasi API (GET, POST, PUT, DELETE) lengkap. Menggunakan Pydantic schema (`FasilitasCreate` dan `FasilitasUpdate`) untuk validasi input otomatis sebelum data masuk ke database PostGIS.
2.  **Autentikasi JWT:** Fitur Register dan Login dengan hashing password `bcrypt`. Endpoint modifikasi data (tambah, edit, hapus) diproteksi menggunakan token JWT.
3.  **Frontend Form Validasi:** Modal Form glassmorphism untuk menambah dan mengedit fasilitas dilengkapi dengan client-side validation (wajib isi, jumlah karakter, dan validitas koordinat).
4.  **Peta Marker Interaktif:** Marker di peta dapat diklik untuk memunculkan detail. Terdapat tombol **Edit** dan **Delete** di dalam popup tersebut (tombol hanya muncul jika pengguna sudah login).

---

## Cara Setup & Menjalankan Aplikasi

### 1. Database (PostgreSQL + PostGIS)
Pastikan PostgreSQL berjalan dan buat sebuah database baru. Eksekusi perintah berikut untuk mengaktifkan fitur spasial:
```sql
CREATE EXTENSION postgis;
```

### 2. Backend (FastAPI)
Buka terminal baru untuk backend:
```powershell
# Masuk ke folder backend
cd "c:\Kuliah\Semster 6\SIG_106\Pertemuan_9\webgis-api"

# Aktifkan virtual environment
.\.venv\Scripts\Activate.ps1

# Konfigurasi Database dan JWT Token:
# Buat/edit file `.env` di folder ini dengan format:
# DATABASE_URL=postgresql://user:password@localhost:5432/namadatabase
# SECRET_KEY=bikin_key_rahasia_bebas
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=60

# Install dependencies
pip install fastapi uvicorn asyncpg python-dotenv pydantic "python-jose[cryptography]" "passlib[bcrypt]" python-multipart

# Jalankan server (Tabel akan terbuat otomatis saat pertama running)
uvicorn main:app --reload --port 8000
```
Backend berjalan di: `http://localhost:8000`

### 3. Frontend (React + Vite)
Buka terminal lain untuk frontend:
```powershell
# Masuk ke folder frontend
cd "c:\Kuliah\Semster 6\SIG_106\Pertemuan_9\webgis-api\frontend"

# Install package
npm install

# Jalankan aplikasi web
npm run dev
```
Frontend berjalan di: `http://localhost:5173`

---

## Screenshot Hasil Pengerjaan

**1. Halaman Login / Registrasi (Auth)**  
![Screenshot Login](Screenshot/login.png)

**2. Tampilan Peta Utama & Marker Popup**  
![Screenshot Peta Utama](Screenshot/Tampilan.png)

**3. Form Tambah / Edit Fasilitas (Validasi Aktif)**  
*Form Tambah:*
![Screenshot Form Tambah](Screenshot/Tambah.png)

*Hasil Data Ditambahkan:*
![Screenshot Hasil Tambah](Screenshot/hasil_tambah.png)

*Hasil Data Diedit:*
![Screenshot Hasil Edit](Screenshot/hasil_edit.png)
