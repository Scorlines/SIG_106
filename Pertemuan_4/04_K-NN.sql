SELECT 
  w.nama AS wilayah,
  f.nama AS fasilitas_terdekat,
  ROUND(ST_Distance(
    w.geom::geography,
    f.geom::geography
  )::numeric, 2) AS jarak_meter
FROM wilayah w
CROSS JOIN LATERAL (
  SELECT nama, geom
  FROM fasilitas_publik
  ORDER BY geom <-> w.geom
  LIMIT 1
) f
ORDER BY w.nama;