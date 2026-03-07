SELECT 
  j.nama AS nama_jalan,
  w.nama AS wilayah
FROM jalan j
JOIN wilayah w ON ST_Intersects(j.geom, w.geom)
ORDER BY w.nama;