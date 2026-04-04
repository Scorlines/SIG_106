-- ST_Intersection: Area Tumpang Tindih (Overlap)
-- Mengidentifikasi dan menghitung area yang saling berpotongan (overlap) 
-- antara zona layanan halte BRT dan area parkir

WITH zona_halte AS (
    SELECT 
        ST_Union(
            ST_Buffer(geom::geography, 500)::geometry
        ) AS zona
    FROM halte_brt
),
zona_parkir AS (
    SELECT 
        ST_Union(
            ST_Buffer(geom::geography, 300)::geometry
        ) AS zona
    FROM area_parkir
)
SELECT 
    'Area Overlap Halte BRT & Parkir' AS deskripsi,
    ST_Intersection(zh.zona, zp.zona) AS area_overlap,
    ST_Area(ST_Intersection(zh.zona, zp.zona)::geography) / 10000 AS luas_overlap_hektar
FROM zona_halte zh, zona_parkir zp
WHERE ST_Intersects(zh.zona, zp.zona);