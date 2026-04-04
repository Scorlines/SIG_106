-- Query 1: ST_Intersects - Mencari nama rumah sakit beserta wilayahnya
-- Dijalankan SEBELUM indeks dibuat
-- Execution Time (Before Index): 0.149 ms

EXPLAIN ANALYZE
SELECT rs.nama, w.nama AS wilayah
FROM rumah_sakit rs
JOIN wilayah w ON ST_Intersects(rs.geom, w.geom);