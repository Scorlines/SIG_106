-- Query 1: ST_Intersects - Mencari nama rumah sakit beserta wilayahnya
-- Dijalankan SESUDAH indeks dibuat
-- Execution Time (After Index): 1.239 ms
-- Database sekarang menggunakan Index Scan pada idx_rumah_sakit_geom

EXPLAIN ANALYZE
SELECT rs.nama, w.nama AS wilayah
FROM rumah_sakit rs
JOIN wilayah w ON ST_Intersects(rs.geom, w.geom);