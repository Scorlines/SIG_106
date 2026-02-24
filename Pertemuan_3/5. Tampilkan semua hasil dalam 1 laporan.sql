-- Ringkasan lengkap untuk laporan
SELECT 
  'JARAK' as tipe_analisis,
  a.nama as objek_1,
  b.nama as objek_2,
  ROUND(ST_Distance(a.geom, b.geom)::numeric, 6) as hasil_tanpa_konversi,
  ROUND(ST_Distance(a.geom::geography, b.geom::geography)::numeric, 2) as hasil_geography_m,
  ROUND(ST_Distance(ST_Transform(a.geom, 32748), ST_Transform(b.geom, 32748))::numeric, 2) as hasil_utm_m
FROM fasilitas_publik a, fasilitas_publik b
WHERE a.nama != b.nama
LIMIT 10;