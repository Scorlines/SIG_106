-- Query 2: ST_Distance - Mencari fasilitas publik dalam radius 1 km
-- Dijalankan SESUDAH indeks dibuat
-- Execution Time (After Index): 0.185 ms
-- Meskipun index sudah dibuat, ST_Distance tetap melakukan Seq Scan 
-- karena tidak dapat memanfaatkan spatial index

EXPLAIN ANALYZE
SELECT nama FROM fasilitas_publik
WHERE ST_Distance(
    geom::geography,
    ST_GeomFromText('POINT(105.26 -5.42)', 4326)::geography
) < 1000;