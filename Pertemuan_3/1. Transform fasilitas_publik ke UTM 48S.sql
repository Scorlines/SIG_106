-- Transform fasilitas_publik ke UTM 48S
SELECT 
  nama,
  ST_AsText(geom) as koordinat_wgs84,
  ST_AsText(ST_Transform(geom, 32748)) as koordinat_utm48s
FROM fasilitas_publik;