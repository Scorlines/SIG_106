# Pertemuan 1 — Pengenalan PostGIS & Operasi Spasial Dasar

## Deskripsi
Pada pertemuan pertama ini dipelajari cara menyimpan, menampilkan, dan mengolah data spasial bertipe **titik (Point)** menggunakan ekstensi **PostGIS** di atas database **PostgreSQL**.  
Studi kasus yang digunakan adalah data **fasilitas publik** di sekitar kampus ITERA (Institut Teknologi Sumatera), Lampung Selatan.

---

## Struktur File

| No. | Nama File | Deskripsi |
|-----|-----------|-----------|
| 1 | `01_create_tabel_fasilitas_publik.sql` | Membuat tabel `fasilitas_publik` dengan kolom geometri bertipe `Point` ber-SRID 4326 |
| 2 | `02_insert_data_fasilitas_publik.sql` | Mengisi tabel dengan 7 data fasilitas publik (kampus, rumah sakit, masjid, sekolah, puskesmas, pasar, kantor pemerintah) |
| 3 | `03_cek_data_ST_AsText.sql` | Menampilkan seluruh data beserta koordinat dalam format **WKT** (Well-Known Text) menggunakan fungsi `ST_AsText()` |
| 4 | `04_jarak_ITERA_ke_fasilitas_km.sql` | Menghitung jarak (km) dari titik ITERA ke setiap fasilitas publik lainnya menggunakan `ST_Distance()` dengan tipe `geography` |

---

## Penjelasan File

### 1. `01_create_tabel_fasilitas_publik.sql`
Membuat tabel dengan struktur berikut:

```sql
CREATE TABLE IF NOT EXISTS fasilitas_publik (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50)  NOT NULL,
    alamat  TEXT,
    geom    GEOMETRY(Point, 4326)
);
```

- **`id`** — primary key auto-increment.
- **`nama`** — nama fasilitas.
- **`jenis`** — kategori fasilitas (Kampus, Rumah Sakit, Masjid, dst.).
- **`alamat`** — alamat lengkap.
- **`geom`** — kolom geometri tipe `Point` dengan sistem koordinat **WGS 84 (EPSG:4326)**.

---

### 2. `02_insert_data_fasilitas_publik.sql`
Memasukkan 7 baris data fasilitas menggunakan fungsi:

- **`ST_MakePoint(longitude, latitude)`** — membuat objek geometri titik dari pasangan koordinat.
- **`ST_SetSRID(..., 4326)`** — menetapkan sistem referensi koordinat WGS 84.

Data yang dimasukkan:

| Nama Fasilitas | Jenis |
|----------------|-------|
| ITERA — Institut Teknologi Sumatera | Kampus |
| RS Urip Sumoharjo | Rumah Sakit |
| Masjid Al-Ikhlas ITERA | Masjid |
| SMA Negeri 14 Bandar Lampung | Sekolah |
| Puskesmas Jati Agung | Puskesmas |
| Pasar Sukarame | Pasar |
| Kantor Kecamatan Jati Agung | Kantor Pemerintah |

---

### 3. `03_cek_data_ST_AsText.sql`
Menampilkan semua data dari tabel beserta representasi geometri dalam format **WKT**:

```sql
SELECT id, nama, jenis, alamat, ST_AsText(geom) AS koordinat_wkt
FROM fasilitas_publik
ORDER BY id;
```

- **`ST_AsText(geom)`** — mengonversi kolom geometri ke teks yang mudah dibaca, contoh: `POINT(105.3152 -5.3582)`.

---

### 4. `04_jarak_ITERA_ke_fasilitas_km.sql`
Menghitung jarak dari titik ITERA ke setiap fasilitas lain dalam satuan **kilometer**:

```sql
SELECT
    nama,
    jenis,
    ROUND(
        ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(105.3152, -5.3582), 4326)::geography
        ) / 1000, 2
    ) AS jarak_dari_itera_km
FROM fasilitas_publik
WHERE nama != 'ITERA - Institut Teknologi Sumatera'
ORDER BY jarak_dari_itera_km;
```

- **`ST_Distance(a::geography, b::geography)`** — menghitung jarak geodetik (di permukaan bumi) dalam satuan **meter**.
- Dibagi **1000** untuk konversi ke kilometer, lalu dibulatkan 2 desimal dengan `ROUND()`.
- Baris ITERA sendiri dikecualikan dengan klausa `WHERE`.

---

## Konsep Utama yang Dipelajari

| Fungsi PostGIS | Kegunaan |
|----------------|----------|
| `ST_MakePoint(lon, lat)` | Membuat objek Point dari koordinat |
| `ST_SetSRID(geom, srid)` | Menetapkan sistem referensi koordinat |
| `ST_AsText(geom)` | Menampilkan geometri dalam format WKT |
| `ST_Distance(a, b)` | Menghitung jarak antara dua geometri |
| `::geography` | Cast ke tipe geography untuk perhitungan jarak nyata (meter) |

---

## Prasyarat
- **PostgreSQL** versi 13 ke atas
- **PostGIS** ekstensi aktif pada database yang digunakan:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

## Cara Menjalankan
Jalankan file secara berurutan sesuai nomor:

```
01 → 02 → 03 → 04
```

Bisa menggunakan **pgAdmin**, **DBeaver**, atau terminal `psql`:

```bash
psql -U postgres -d nama_database -f 01_create_tabel_fasilitas_publik.sql
psql -U postgres -d nama_database -f 02_insert_data_fasilitas_publik.sql
psql -U postgres -d nama_database -f 03_cek_data_ST_AsText.sql
psql -U postgres -d nama_database -f 04_jarak_ITERA_ke_fasilitas_km.sql
```
