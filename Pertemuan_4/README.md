# Pertemuan 4: Analisis Relasi Spasial dan Query Lanjutan

## Deskripsi
Pada pertemuan keempat ini dipelajari berbagai operasi relasi spasial dan query analisis lanjutan menggunakan PostGIS. Pertemuan ini fokus pada **pemilihan data berdasarkan hubungan spasial antar objek**, termasuk mencari jarak antar fasilitas, relasi topologi antara geometri, dan analisis kepadatan fasilitas terhadap wilayah.

---

## Struktur File

| No. | Nama File | Deskripsi |
|-----|-----------|-----------|
| 1 | `01_ST_Distance.sql` | Menghitung jarak antara dua fasilitas tertentu menggunakan `ST_Distance()` |
| 2 | `02_ST_Intersects.sql` | Menemukan jalan yang berpotongan dengan wilayah tertentu menggunakan `ST_Intersects()` |
| 3 | `03_ST_Within.sql` | Menemukan fasilitas publik yang berada di dalam wilayah tertentu menggunakan `ST_Within()` |
| 4 | `04_K-NN.sql` | Menemukan fasilitas terdekat untuk setiap wilayah menggunakan K-Nearest Neighbor (KNN) |
| 5 | `05_ST_Contains_GROUP_BY.sql` | Menghitung kepadatan fasilitas per km² menggunakan `ST_Contains()` dan agregasi `GROUP BY` |
| 6 | `06_ST_DWithin_CASE.sql` | Menentukan status layanan wilayah berdasarkan ketersediaan fasilitas dalam radius tertentu |

---

## Penjelasan File

### 1. `01_ST_Distance.sql` — Jarak Antar Fasilitas
**Fungsi**: Menghitung jarak Euclidean (geodetik) antara dua fasilitas.

```sql
SELECT 
  a.nama AS fasilitas_a,
  b.nama AS fasilitas_b,
  ROUND(ST_Distance(
    a.geom::geography,
    b.geom::geography
  )::numeric, 2) AS jarak_meter
FROM rumah_sakit a, rumah_sakit b
WHERE a.id = 1 AND b.id = 3;
```

- **`ST_Distance(a.geom::geography, b.geom::geography)`** — menghitung jarak dalam meter antara dua geometri dalam tipe `geography`.
- **`ROUND(..., 2)`** — membulatkan hasil ke 2 desimal.
- Query ini membandingkan fasilitas dengan ID 1 dan ID 3.

---

### 2. `02_ST_Intersects.sql` — Jalan yang Memotong Wilayah
**Fungsi**: Menemukan jalan yang berpotongan dengan wilayah tertentu.

```sql
SELECT 
  j.nama AS nama_jalan,
  w.nama AS wilayah
FROM jalan j
JOIN wilayah w ON ST_Intersects(j.geom, w.geom)
ORDER BY w.nama;
```

- **`ST_Intersects(j.geom, w.geom)`** — mengembalikan `true` jika geometri jalan berpotongan dengan geometri wilayah.
- Menggunakan **INNER JOIN** sehingga hanya jalan yang berpotongan yang ditampilkan.
- Hasil diurutkan berdasarkan nama wilayah.

---

### 3. `03_ST_Within.sql` — Fasilitas di Dalam Wilayah
**Fungsi**: Menemukan fasilitas publik yang **sepenuhnya** berada di dalam wilayah tertentu.

```sql
SELECT 
  f.nama AS fasilitas,
  f.alamat,
  w.nama AS wilayah
FROM fasilitas_publik f
JOIN wilayah w ON ST_Within(f.geom, w.geom)
ORDER BY w.nama;
```

- **`ST_Within(f.geom, w.geom)`** — mengembalikan `true` jika seluruh geometri fasilitas berada di dalam geometri wilayah.
- Perbedaan dengan `ST_Intersects()`: `ST_Within()` memerlukan **seluruh** objek berada di dalam, tidak hanya berpotongan.
- Hasil diurutkan berdasarkan nama wilayah.

---

### 4. `04_K-NN.sql` — Fasilitas Terdekat (K-Nearest Neighbor)
**Fungsi**: Mencari **fasilitas terdekat** untuk setiap wilayah.

```sql
SELECT 
  w.nama AS wilayah,
  f.nama AS fasilitas_terdekat,
  ROUND(ST_Distance(
    w.geom::geography,
    f.geom::geography
  )::numeric, 2) AS jarak_meter
FROM wilayah w
CROSS JOIN LATERAL (
  SELECT nama, geom
  FROM fasilitas_publik
  ORDER BY geom <-> w.geom
  LIMIT 1
) f
ORDER BY w.nama;
```

- **`CROSS JOIN LATERAL`** — teknik untuk menjalankan subquery untuk setiap baris di outer query.
- **`geom <-> w.geom`** — operator KNN PostGIS yang mengurutkan hasil berdasarkan jarak terdekat.
- **`LIMIT 1`** — mengambil hanya 1 hasil (fasilitas terdekat).
- Hasil: Untuk setiap wilayah, tampilkan fasilitas terdekat dan jaraknya.

---

### 5. `05_ST_Contains_GROUP_BY.sql` — Kepadatan Fasilitas per Wilayah
**Fungsi**: Menghitung jumlah fasilitas dan kepadatan fasilitas di setiap wilayah.

```sql
SELECT 
  w.nama AS wilayah,
  COUNT(f.id) AS jumlah_fasilitas,
  ROUND((ST_Area(w.geom::geography) / 1000000)::numeric, 2) AS luas_km2,
  ROUND((COUNT(f.id)::numeric / 
    NULLIF((ST_Area(w.geom::geography) / 1000000)::numeric, 0)), 2
  ) AS fasilitas_per_km2
FROM wilayah w
LEFT JOIN fasilitas_publik f ON ST_Contains(w.geom, f.geom)
GROUP BY w.id, w.nama, w.geom
ORDER BY fasilitas_per_km2 DESC;
```

- **`ST_Contains(w.geom, f.geom)`** — mengembalikan `true` jika wilayah memuat seluruh geometri fasilitas (kebalikan dari `ST_Within`).
- **`LEFT JOIN`** — memastikan semua wilayah ditampilkan, meskipun tidak ada fasilitas di dalamnya.
- **`COUNT(f.id)`** — menghitung jumlah fasilitas per wilayah.
- **`ST_Area(w.geom::geography) / 1000000`** — menghitung luas wilayah dalam km² (dibagi 1.000.000 untuk konversi m² ke km²).
- **`NULLIF(..., 0)`** — mencegah pembagian dengan nol.
- **`GROUP BY`** — mengelompokkan hasil per wilayah.

---

### 6. `06_ST_DWithin_CASE.sql` — Status Layanan Fasilitas
**Fungsi**: Menentukan apakah wilayah "Terlayani" atau "Tidak Terlayani" berdasarkan ketersediaan fasilitas dalam radius 1 km.

```sql
SELECT 
  w.nama AS wilayah,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM fasilitas_publik f
      WHERE ST_DWithin(w.geom::geography, f.geom::geography, 1000)
    ) THEN 'Terlayani'
    ELSE 'Tidak Terlayani'
  END AS status_layanan
FROM wilayah w;
```

- **`ST_DWithin(w.geom::geography, f.geom::geography, 1000)`** — mengembalikan `true` jika terdapat fasilitas dalam radius **1000 meter** (1 km) dari wilayah.
- **`EXISTS`** — mengecek keberadaan minimal satu fasilitas.
- **`CASE ... WHEN ... THEN ... ELSE ... END`** — logika kondisional SQL untuk menentukan status.
- Hasil: Setiap wilayah akan ditampilkan dengan status layanannya.

---

## Konsep Utama yang Dipelajari

### Operasi Relasi Spasial (Spatial Relationships)

| Operator | Deskripsi | Digunakan di File |
|----------|-----------|-------------------|
| **`ST_Distance()`** | Menghitung jarak antar geometri | 01, 04 |
| **`ST_Intersects()`** | Cek apakah geometri berpotongan | 02 |
| **`ST_Within()`** | Cek apakah geometri A dalam geometri B | 03 |
| **`ST_Contains()`** | Cek apakah geometri A memuat geometri B | 05 |
| **`ST_DWithin()`** | Cek apakah geometri dalam radius tertentu | 06 |
| **`<->` (KNN)** | Operator K-Nearest Neighbor | 04 |

### Teknik Query Lanjutan

1. **Self-Join** (File 01): Membandingkan data dalam tabel yang sama.
2. **INNER JOIN** (File 02, 03): Menggabungkan tabel berdasarkan kondisi relasi spasial.
3. **LEFT JOIN** (File 05): Mempertahankan semua baris dari tabel kiri meskipun tidak ada kecocokan.
4. **CROSS JOIN LATERAL** (File 04): Menjalankan subquery untuk setiap baris outer query.
5. **Aggregation** (File 05): Menggunakan `COUNT()`, `GROUP BY` untuk analisis statistik.
6. **EXISTS & CASE** (File 06): Logika kondisional dalam SELECT.

---

## Prasyarat

- PostgreSQL dengan ekstensi PostGIS
- Tabel `fasilitas_publik`, `jalan`, `wilayah`, dan `rumah_sakit` dengan kolom geometri
- Semua geometri menggunakan SRID 4326 (WGS 84)

---

## Cara Menjalankan

1. Pastikan semua tabel sudah dibuat dan berisi data.
2. Jalankan script secara berurutan dari 01 sampai 06.
3. Perhatikan hasil query untuk memahami perilaku masing-masing operasi relasi spasial.
4. Modifikasi query sesuai kebutuhan analisis Anda.