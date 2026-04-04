-- Query 3: ST_Intersects - Mencari jalan yang melewati Kecamatan Sukarame
-- Dijalankan SESUDAH indeks dibuat
-- Execution Time (Before Index): 16.223 ms
-- Execution Time (After Index): 0.197 ms
-- Database sekarang menggunakan Index Scan pada idx_jalan_geom
-- Execution Time turun drastis dari 16.223 ms menjadi 0.197 ms

EXPLAIN ANALYZE
SELECT j.nama AS nama_jalan, w.nama AS wilayah
FROM jalan j
JOIN wilayah w ON ST_Intersects(j.geom, w.geom)
WHERE w.nama = 'Kecamatan Sukarame';