SELECT 
  w.nama AS wilayah,
  COUNT(f.id) AS jumlah_fasilitas,
  ROUND((ST_Area(w.geom::geography) / 1000000)::numeric, 2) AS luas_km2,
  ROUND((COUNT(f.id)::numeric / 
    NULLIF((ST_Area(w.geom::geography) / 1000000)::numeric, 0)), 2
  ) AS fasilitas_per_km2
FROM wilayah w
LEFT JOIN fasilitas_publik f ON ST_Contains(w.geom, f.geom)
GROUP BY w.id, w.nama, w.geom
ORDER BY fasilitas_per_km2 DESC;