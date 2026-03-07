SELECT 
  f.nama AS fasilitas,
  f.alamat,
  w.nama AS wilayah
FROM fasilitas_publik f
JOIN wilayah w ON ST_Within(f.geom, w.geom)
ORDER BY w.nama;