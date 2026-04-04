# Pertemuan 5: Operasi Geometri Lanjutan - Buffer, Union, Intersection, dan Centroid

## Deskripsi
Pada pertemuan kelima ini dipelajari berbagai operasi geometri lanjutan untuk analisis spasial lebih kompleks. Fokus pada pembuatan zona layanan (buffer), penggabungan geometri (union), identifikasi area tumpang tindih (intersection), dan penentuan titik acuan untuk labeling (centroid). Hasil query dapat divisualisasikan langsung di QGIS.

---

## Struktur File

| No. | Nama File | Deskripsi |
|-----|-----------|-----------|
| 1 | `01_buffer_union_halte_brt.sql` | Membuat buffer 500m di sekitar halte BRT dan menggabungkannya menjadi satu zona layanan terpadu |
| 2 | `02_buffer_union_area_parkir.sql` | Membuat buffer 300m di sekitar area parkir dan menggabungkannya menjadi satu zona layanan terpadu |
| 3 | `03_intersection_area_tumpang_tindih.sql` | Mengidentifikasi dan menghitung area yang saling berpotongan antara zona halte dan zona parkir |
| 4 | `04_centroid_labeling_wilayah.sql` | Menentukan titik pusat (centroid) setiap kecamatan untuk keperluan pelabelan di peta |

---

## Penjelasan File

### 1. `01_buffer_union_halte_brt.sql` — Buffer & Union Halte BRT
**Fungsi**: Membuat zona layanan 500 meter di sekitar semua halte BRT dengan menggabungkan buffer individual menjadi satu kesatuan.

```sql
SELECT 
    'Zona Layanan Halte BRT 500m' AS nama_zona,
    ST_Union(
        ST_Buffer(
            geom::geography, 
            500  -- radius 500 meter
        )::geometry
    ) AS zona_layanan,
    ST_Area(...) / 10000 AS luas_zona_hektar
FROM halte_brt
GROUP BY TRUE;
```

**Penjelasan operasi:**
- **`ST_Buffer(geom::geography, 500)`** — membuat polygon buffer dengan radius 500 meter di sekitar setiap titik halte.
- **`ST_Union(...)`** — menggabungkan semua buffer polygon menjadi satu kesatuan geometri tanpa garis tumpang tindih.
- **`ST_Area(...) / 10000`** — menghitung luas zona dalam hektar (m² dikonversi ke hektar dengan dibagi 10.000).
- **`GROUP BY TRUE`** — mengagregasi semua baris menjadi satu hasil combined.

**Output**: Satu polygon gabungan yang merepresentasikan zona layanan halte BRT seluas X hektar.

---

### 2. `02_buffer_union_area_parkir.sql` — Buffer & Union Area Parkir
**Fungsi**: Membuat zona layanan 300 meter di sekitar semua area parkir dengan menggabungkan buffer individual menjadi satu kesatuan.

```sql
SELECT 
    'Zona Layanan Area Parkir 300m' AS nama_zona,
    ST_Union(
        ST_Buffer(
            geom::geography, 
            300  -- radius 300 meter
        )::geometry
    ) AS zona_layanan,
    ST_Area(...) / 10000 AS luas_zona_hektar
FROM area_parkir
GROUP BY TRUE;
```

**Penjelasan operasi:**
- **`ST_Buffer(geom::geography, 300)`** — membuat polygon buffer dengan radius 300 meter di sekitar setiap area parkir.
- **`ST_Union(...)`** — menggabungkan semua buffer menjadi satu kesatuan.
- Radius lebih kecil (300m) dibanding halte (500m) mencerminkan jangkauan layanan yang berbeda.

**Output**: Satu polygon gabungan yang merepresentasikan zona layanan area parkir seluas Y hektar.

---

### 3. `03_intersection_area_tumpang_tindih.sql` — Intersection Area Overlap
**Fungsi**: Mengidentifikasi dan mengukur area yang saling berpotongan antara zona halte dan zona parkir.

```sql
WITH zona_halte AS (
    SELECT ST_Union(ST_Buffer(geom::geography, 500)::geometry) AS zona
    FROM halte_brt
),
zona_parkir AS (
    SELECT ST_Union(ST_Buffer(geom::geography, 300)::geometry) AS zona
    FROM area_parkir
)
SELECT 
    'Area Overlap Halte BRT & Parkir' AS deskripsi,
    ST_Intersection(zh.zona, zp.zona) AS area_overlap,
    ST_Area(ST_Intersection(...)) / 10000 AS luas_overlap_hektar
FROM zona_halte zh, zona_parkir zp
WHERE ST_Intersects(zh.zona, zp.zona);
```

**Penjelasan operasi:**
- **`WITH ... AS`** — common table expressions (CTE) untuk membuat zona gabungan halte dan parkir sebagai subquery.
- **`ST_Intersection(zh.zona, zp.zona)`** — membuat polygon baru dari area yang saling overlap antara kedua zona.
- **`ST_Intersects(...)`** — kondisi WHERE untuk memastikan kedua zona memang berpotongan.
- **`ST_Area(...) / 10000`** — menghitung luas area overlap dalam hektar.

**Output**: Polygon area tumpang tindih dan luasnya dalam hektar.

**Kegunaan**: Mengidentifikasi area dengan layanan ganda (halte + parkir) untuk perencanaan lebih baik.

---

### 4. `04_centroid_labeling_wilayah.sql` — Centroid untuk Labeling
**Fungsi**: Menentukan titik pusat (centroid) dari setiap polygon kecamatan untuk penempatan label di peta.

```sql
SELECT 
    id,
    nama AS nama_kecamatan,
    ST_Centroid(geom) AS titik_label,
    ST_Area(geom::geography) / 1000000 AS luas_km2
FROM kecamatan
ORDER BY nama;
```

**Penjelasan operasi:**
- **`ST_Centroid(geom)`** — menghitung titik pusat (center of mass) dari polygon. Untuk polygon reguler, ini adalah titik tengah yang ideal untuk penempatan label.
- **`ST_Area(geom::geography) / 1000000`** — menghitung luas kecamatan dalam km².
- **`ORDER BY nama`** — mengurutkan hasil berdasarkan nama kecamatan.

**Output**: Untuk setiap kecamatan, ditampilkan:
- `id` — identitas kecamatan
- `nama_kecamatan` — nama kecamatan
- `titik_label` — titik geometri Point (koordinat centroid)
- `luas_km2` — luas kecamatan dalam km²

**Kegunaan di QGIS**: 
- Gunakan kolom `titik_label` sebagai layer titik untuk penempatan label nama kecamatan.
- Label akan ditempatkan otomatis di tengah setiap polygon untuk hasil visual yang lebih baik.

---

## Operasi Geometri yang Digunakan

| Operasi | Fungsi | Output | Digunakan di |
|---------|--------|--------|-------------|
| **ST_Buffer** | Membuat polygon di sekitar geometri dengan radius tertentu | Polygon | 01, 02 |
| **ST_Union** | Menggabungkan multiple geometri menjadi satu kesatuan | Geometry (gabungan) | 01, 02, 03 |
| **ST_Intersection** | Menghasilkan geometri dari area yang saling berpotongan | Geometry (overlap) | 03 |
| **ST_Centroid** | Menghitung titik pusat dari polygon | Point | 04 |
| **ST_Area** | Menghitung luas geometri | Numeric (m² atau m²) | 01, 02, 03, 04 |
| **ST_Intersects** | Cek apakah dua geometri berpotongan | Boolean | 03 |

---

## Visualisasi di QGIS

### Cara Menggunakan Query di QGIS

1. **Koneksi Database**: Buka DB Manager di QGIS → Hubungkan ke PostgreSQL dengan PostGIS
2. **Load Query**: 
   - Untuk query 01, 02, 03: Gunakan tab "SQL Window" dan copy-paste query
   - Hasil polygon dapat langsung di-load sebagai layer
3. **Styling**:
   - **Zona Halte (Query 01)**: Warna biru dengan transparansi 30%
   - **Zona Parkir (Query 02)**: Warna hijau dengan transparansi 30%
   - **Area Overlap (Query 03)**: Warna merah dengan transparansi 50% (menunjukkan area prioritas)
   - **Label Centroid (Query 04)**: Tampilkan sebagai Point layer dengan label teks nama kecamatan

### Konfigurasi Label di QGIS
1. Buka layer dari query 04 (centroid)
2. Properties → Labels → Enable Labels
3. Label field: Pilih `nama_kecamatan`
4. Placement: Atur positioning agar label terbaca dengan baik

---

## Prasyarat

- PostgreSQL dengan ekstensi PostGIS
- Tabel `halte_brt` dengan geometri Point (lokasi halte)
- Tabel `area_parkir` dengan geometri Point (lokasi area parkir)
- Tabel `kecamatan` dengan geometri Polygon (batas wilayah kecamatan)
- Semua geometri menggunakan SRID 4326 (WGS 84)
- QGIS untuk visualisasi hasil operasi geometri

---

## Cara Menjalankan

1. Pastikan semua tabel sudah dibuat dan berisi data.
2. Jalankan script secara berurutan dari 01 sampai 04 di PostgreSQL/PostGIS.
3. Verifikasi hasil di terminal PostgreSQL atau langsung load ke QGIS.
4. Visualisasikan hasil dengan styling yang sesuai untuk analisis lebih lanjut.

---

## Kesimpulan

Pertemuan 5 memperkenalkan operasi geometri yang lebih kompleks:
- **Buffer**: Membuat zona layanan dengan radius tertentu
- **Union**: Menyatukan multiple geometri menjadi satu kesatuan
- **Intersection**: Menemukan area overlap untuk analisis multi-layer
- **Centroid**: Penentuan titik referensi untuk labeling dan analisis spasial lebih lanjut

Kombinasi operasi ini sangat berguna untuk analisis urban planning, coverage analysis, dan visualisasi data spasial yang lebih baik di QGIS.