SELECT 
  a.nama as dari,
  b.nama as ke,
  -- Cara 1: tanpa konversi
  ST_Distance(a.geom, b.geom) as jarak_derajat,
  -- Cara 2: geography
  ST_Distance(
    a.geom::geography,
    b.geom::geography
  ) as jarak_geography_m,
  -- Cara 3: UTM
  ST_Distance(
    ST_Transform(a.geom, 32748),
    ST_Transform(b.geom, 32748)
  ) as jarak_utm_m,
  -- Selisih cara 2 dan 3
  ABS(
    ST_Distance(a.geom::geography, b.geom::geography) - 
    ST_Distance(ST_Transform(a.geom, 32748), ST_Transform(b.geom, 32748))
  ) as selisih_m
FROM fasilitas_publik a, fasilitas_publik b
WHERE a.nama != b.nama
LIMIT 10;