# Pertemuan 2 — Operasi Spasial Lanjutan: LineString, Polygon, dan Relasi Spasial

## Deskripsi
Pada pertemuan kedua ini dipelajari cara menyimpan, menampilkan, dan mengolah data spasial bertipe **garis (LineString)** dan **poligon (Polygon)** menggunakan ekstensi **PostGIS** di atas database **PostgreSQL**.  
Studi kasus yang digunakan adalah data **jalan** dan **wilayah** di sekitar kampus ITERA (Institut Teknologi Sumatera), Lampung Selatan.  
Juga dipelajari operasi spasial lanjutan seperti konversi format data, perhitungan panjang jalan dan luas wilayah, serta relasi spasial antar objek.

---

## Struktur File

| No. | Nama File | Deskripsi |
|-----|-----------|-----------|
| 1 | `01_create_table_jalan.sql` | Membuat tabel `jalan` dengan kolom geometri bertipe `LineString` ber-SRID 4326 dan mengisi data jalan |
| 2 | `02_create_table_wilayah.sql` | Membuat tabel `wilayah` dengan kolom geometri bertipe `Polygon` ber-SRID 4326 dan mengisi data wilayah |
| 3 | `03_konversi_format.sql` | Menampilkan data jalan dan wilayah dalam format WKT dan GeoJSON |
| 4 | `04_panjang_jalan_dan_luas_wilayah.sql` | Menghitung panjang jalan (km) dan luas wilayah (km²) menggunakan fungsi spasial |
| 5 | `05_jalan_di_dalam_wilayah_tertentu.sql` | Menampilkan jalan yang berada di dalam wilayah tertentu menggunakan relasi spasial `ST_Intersects()` |

---

## Penjelasan File

### 1. `01_create_table_jalan.sql`
Membuat tabel jalan dengan struktur berikut:

```sql
CREATE TABLE IF NOT EXISTS jalan (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50),   -- arteri, kolektor, lokal
    geom    GEOMETRY(LineString, 4326)
);
```

- **`id`** — primary key auto-increment.
- **`nama`** — nama jalan.
- **`jenis`** — kategori jalan (Arteri, Kolektor, Lokal).
- **`geom`** — kolom geometri tipe `LineString` dengan sistem koordinat **WGS 84 (EPSG:4326)**.

Mengisi data minimal 3 jalan menggunakan `ST_GeomFromText()` dengan format LINESTRING.

### 2. `02_create_table_wilayah.sql`
Membuat tabel wilayah dengan struktur berikut:

```sql
CREATE TABLE IF NOT EXISTS wilayah (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50),   -- kelurahan, kecamatan, dll
    geom    GEOMETRY(Polygon, 4326)
);
```

- **`id`** — primary key auto-increment.
- **`nama`** — nama wilayah.
- **`jenis`** — kategori wilayah (Kelurahan, Kecamatan, dll).
- **`geom`** — kolom geometri tipe `Polygon` dengan sistem koordinat **WGS 84 (EPSG:4326)**.

Mengisi data minimal 2 wilayah menggunakan `ST_GeomFromText()` dengan format POLYGON.

### 3. `03_konversi_format.sql`
Menampilkan data spasial dalam berbagai format:

- **`ST_AsText()`** — format WKT (Well-Known Text) untuk jalan dan wilayah.
- **`ST_AsGeoJSON()`** — format GeoJSON untuk integrasi dengan aplikasi web seperti Leaflet.

### 4. `04_panjang_jalan_dan_luas_wilayah.sql`
Menghitung metrik spasial:

- **Panjang jalan**: Menggunakan `ST_Length(geom::geography)` untuk menghitung panjang dalam meter, kemudian dikonversi ke km.
- **Luas wilayah**: Menggunakan `ST_Area(geom::geography)` untuk menghitung luas dalam meter persegi, kemudian dikonversi ke km².

### 5. `05_jalan_di_dalam_wilayah_tertentu.sql`
Menggunakan relasi spasial untuk menemukan jalan yang berpotongan dengan wilayah tertentu:

- **`ST_Intersects(j.geom, w.geom)`** — mengembalikan true jika geometri jalan berpotongan dengan geometri wilayah.

---

## Catatan
- Pastikan ekstensi PostGIS telah diaktifkan di database PostgreSQL.
- Semua geometri menggunakan SRID 4326 (WGS 84).
- Untuk perhitungan jarak/panjang/luas yang akurat, gunakan tipe `geography` bukan `geometry`.