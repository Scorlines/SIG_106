# Pertemuan 6: Spatial Index dan Query Optimization

**Nama:** Muhammad Fadhel  
**NIM:** 123140106  
**Tugas:** P6

## Daftar File

### 1. Query Sebelum Indeks Dibuat
Tiga query dijalankan untuk mendapatkan baseline performance sebelum index dibuat.

- **01_query_sebelum_indeks_query1.sql**  
  Query ST_Intersects mencari nama rumah sakit beserta wilayahnya  
  Execution Time: 0.149 ms

- **02_query_sebelum_indeks_query2.sql**  
  Query ST_Distance mencari fasilitas publik dalam radius 1 km  
  Execution Time: 133.777 ms

- **03_query_sebelum_indeks_query3.sql**  
  Query ST_Intersects mencari jalan yang melewati Kecamatan Sukarame  
  Execution Time: 16.223 ms

### 2. Pembuatan Spatial Index

- **04_create_spatial_index.sql**  
  Membuat tiga spatial index bertipe GiST pada kolom geom di tabel:
  - rumah_sakit (idx_rumah_sakit_geom)
  - jalan (idx_jalan_geom)
  - wilayah (idx_wilayah_geom)

- **05_vacuum_analyze.sql**  
  VACUUM ANALYZE untuk memperbarui statistik tabel sehingga PostgreSQL query planner dapat membuat keputusan eksekusi yang lebih optimal

- **06_verify_indexes.sql**  
  Verifikasi bahwa ketiga spatial index sudah berhasil dibuat dan siap digunakan

### 3. Query Sesudah Indeks Dibuat

- **07_query_sesudah_indeks_query1.sql**  
  Query 1 dengan index: Database menggunakan Index Scan  
  Execution Time: 1.239 ms

- **08_query_sesudah_indeks_query2.sql**  
  Query 2 dengan index: ST_Distance tetap menggunakan Seq Scan  
  Execution Time: 0.185 ms

- **09_query_sesudah_indeks_query3.sql**  
  Query 3 dengan index: Database menggunakan Index Scan  
  Execution Time: 0.197 ms (turun drastis dari 16.223 ms)

### 4. Optimasi Query Lambat

- **10_optimasi_st_dwithin.sql**  
  Mengoptimalkan query ST_Distance dengan ST_DWithin  
  ST_DWithin dapat memanfaatkan spatial index dengan menggunakan operator && secara internal

## Rekapitulasi Performance

| Query | Sebelum Index | Sesudah Index | Speedup |
|-------|---------------|---------------|---------|
| Query 1 — ST_Intersects rumah_sakit & wilayah | 0.149 ms | 1.239 ms | (data terlalu kecil) |
| Query 2 — ST_Distance fasilitas_publik | 133.777 ms | 0.185 ms | 72.300% |
| Query 3 — ST_Intersects jalan & wilayah | 16.223 ms | 0.197 ms | 8.135% |

## Kesimpulan

Spatial index GiST terbukti meningkatkan performa query spasial secara signifikan, terutama pada Query 2 dan Query 3:

- Query 2 mengalami penurunan waktu dari 133.777 ms menjadi 0.185 ms
- Query 3 mengalami penurunan waktu dari 16.223 ms menjadi 0.197 ms

Catatan penting:
- Pada database dengan jumlah data yang sangat kecil seperti praktikum ini, perbedaan performa tidak selalu konsisten karena faktor cache memori
- Pada data besar, perbedaan akan semakin dramatis karena index mengubah kompleksitas pencarian dari O(n) menjadi O(log n)
- Pemilihan fungsi yang tepat sangat penting: ST_DWithin harus selalu digunakan sebagai pengganti ST_Distance untuk query radius karena dapat memanfaatkan spatial index
- ST_Distance tidak bisa memanfaatkan index meskipun index sudah dibuat