SELECT 
  a.nama AS fasilitas_a,
  b.nama AS fasilitas_b,
  ROUND(ST_Distance(
    a.geom::geography,
    b.geom::geography
  )::numeric, 2) AS jarak_meter
FROM rumah_sakit a, rumah_sakit b
WHERE a.id = 1 AND b.id = 3;