-- 3a. ST_AsText() - tampilkan WKT semua jalan
SELECT
    id,
    nama,
    jenis,
    ST_AsText(geom) AS wkt
FROM jalan
ORDER BY id;

-- 3b. ST_AsText() - tampilkan WKT semua wilayah
SELECT
    id,
    nama,
    jenis,
    ST_AsText(geom) AS wkt
FROM wilayah
ORDER BY id;

-- 3c. ST_AsGeoJSON() - untuk jalan (format web/Leaflet)
SELECT
    nama,
    ST_AsGeoJSON(geom) AS geojson
FROM jalan
ORDER BY id;

-- 3d. ST_AsGeoJSON() - untuk wilayah
SELECT
    nama,
    ST_AsGeoJSON(geom) AS geojson
FROM wilayah
ORDER BY id;

-- ============================================================
-- BAGIAN 4: VALIDASI GEOMETRI (untuk screenshot tugas)
-- ============================================================

-- 4a. Validasi jalan
SELECT
    nama,
    ST_IsValid(geom)   AS valid,
    ST_IsSimple(geom)  AS simple,
    GeometryType(geom) AS tipe,
    ROUND(ST_Length(geom::geography)::numeric, 2) AS panjang_meter
FROM jalan
ORDER BY id;

-- 4b. Validasi wilayah
SELECT
    nama,
    ST_IsValid(geom)   AS valid,
    ST_IsSimple(geom)  AS simple,
    GeometryType(geom) AS tipe,
    ROUND(ST_Area(geom::geography)::numeric, 2) AS luas_m2
FROM wilayah
ORDER BY id;