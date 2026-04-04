-- Query 3: ST_Intersects - Mencari jalan yang melewati Kecamatan Sukarame
-- Dijalankan SEBELUM indeks dibuat
-- Execution Time (Before Index): 16.223 ms

EXPLAIN ANALYZE
SELECT j.nama AS nama_jalan, w.nama AS wilayah
FROM jalan j
JOIN wilayah w ON ST_Intersects(j.geom, w.geom)
WHERE w.nama = 'Kecamatan Sukarame';