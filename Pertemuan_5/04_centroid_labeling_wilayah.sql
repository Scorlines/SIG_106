-- ST_Centroid: Labeling Wilayah
-- Menghitung titik pusat (center of mass) dari polygon kecamatan
-- untuk keperluan pelabelan di peta QGIS

SELECT 
    id,
    nama AS nama_kecamatan,
    ST_Centroid(geom) AS titik_label,
    ST_Area(geom::geography) / 1000000 AS luas_km2
FROM kecamatan
ORDER BY nama;