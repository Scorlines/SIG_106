-- OPTIMASI QUERY LAMBAT: ST_DWithin vs ST_Distance
-- ST_Distance tetap melakukan Seq Scan meskipun index tersedia 
-- karena menghitung jarak ke seluruh baris terlebih dahulu sebelum melakukan filter

-- Query Lambat (ST_Distance):
-- Execution Time: 0.073 ms
EXPLAIN ANALYZE
SELECT nama FROM fasilitas_publik
WHERE ST_Distance(
    geom::geography,
    ST_GeomFromText('POINT(105.26 -5.42)', 4326)::geography
) < 1000;

-- Query Cepat (ST_DWithin):
-- Execution Time: 1.136 ms
-- ST_DWithin menggantikan ST_Distance dengan memanfaatkan operator && secara internal
-- sehingga dapat menggunakan spatial index
-- Hasil data identik namun lebih efisien pada data besar
EXPLAIN ANALYZE
SELECT nama FROM fasilitas_publik
WHERE ST_DWithin(
    geom::geography,
    ST_GeomFromText('POINT(105.26 -5.42)', 4326)::geography,
    1000
);