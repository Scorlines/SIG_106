-- Buffer & ST_Union Fasilitas 2: Area Parkir
-- Membuat buffer polygon 300 meter di sekitar area parkir
-- Menggabungkan multiple buffer menjadi satu kesatuan zona layanan tanpa tumpang tindih

SELECT 
    'Zona Layanan Area Parkir 300m' AS nama_zona,
    ST_Union(
        ST_Buffer(
            geom::geography, 
            300  -- radius 300 meter
        )::geometry
    ) AS zona_layanan,
    ST_Area(
        ST_Union(
            ST_Buffer(
                geom::geography, 
                300
            )::geometry
        )::geography
    ) / 10000 AS luas_zona_hektar
FROM area_parkir
GROUP BY TRUE;