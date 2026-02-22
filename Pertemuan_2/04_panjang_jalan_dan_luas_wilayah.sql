-- Panjang setiap jalan dalam km
SELECT
    nama,
    jenis,
    ROUND(ST_Length(geom::geography)::numeric / 1000, 3) AS panjang_km
FROM jalan
ORDER BY panjang_km DESC;

-- Luas setiap wilayah dalam km2
SELECT
    nama,
    jenis,
    ROUND((ST_Area(geom::geography) / 1000000)::numeric, 4) AS luas_km2
FROM wilayah
ORDER BY luas_km2 DESC;