-- CARA 1: Tanpa konversi (hasil dalam derajat - SALAH)
SELECT 
  a.nama as dari,
  b.nama as ke,
  ST_Distance(a.geom, b.geom) as jarak_derajat
FROM fasilitas_publik a, fasilitas_publik b
WHERE a.nama != b.nama
LIMIT 5;

-- CARA 2: Menggunakan geography (hasil dalam meter)
SELECT 
  a.nama as dari,
  b.nama as ke,
  ST_Distance(
    a.geom::geography,
    b.geom::geography
  ) as jarak_meter_geography
FROM fasilitas_publik a, fasilitas_publik b
WHERE a.nama != b.nama
LIMIT 5;

-- CARA 3: Transform ke UTM dulu (hasil dalam meter)
SELECT 
  a.nama as dari,
  b.nama as ke,
  ST_Distance(
    ST_Transform(a.geom, 32748),
    ST_Transform(b.geom, 32748)
  ) as jarak_meter_utm
FROM fasilitas_publik a, fasilitas_publik b
WHERE a.nama != b.nama
LIMIT 5;