-- Query 2: ST_Distance - Mencari fasilitas publik dalam radius 1 km
-- Dijalankan SEBELUM indeks dibuat
-- Execution Time (Before Index): 133.777 ms

EXPLAIN ANALYZE
SELECT nama FROM fasilitas_publik
WHERE ST_Distance(
    geom::geography,
    ST_GeomFromText('POINT(105.26 -5.42)', 4326)::geography
) < 1000;