-- Buffer & ST_Union Fasilitas 1: Halte BRT
-- Membuat buffer polygon 500 meter di sekitar halte BRT
-- Menggabungkan multiple buffer menjadi satu kesatuan zona layanan tanpa tumpang tindih

SELECT 
    'Zona Layanan Halte BRT 500m' AS nama_zona,
    ST_Union(
        ST_Buffer(
            geom::geography, 
            500  -- radius 500 meter
        )::geometry
    ) AS zona_layanan,
    ST_Area(
        ST_Union(
            ST_Buffer(
                geom::geography, 
                500
            )::geometry
        )::geography
    ) / 10000 AS luas_zona_hektar
FROM halte_brt
GROUP BY TRUE;