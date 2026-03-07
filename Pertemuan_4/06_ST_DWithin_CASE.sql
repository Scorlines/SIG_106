SELECT 
  w.nama AS wilayah,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM fasilitas_publik f
      WHERE ST_DWithin(w.geom::geography, f.geom::geography, 1000)
    ) THEN 'Terlayani'
    ELSE 'Tidak Terlayani'
  END AS status_layanan
FROM wilayah w;