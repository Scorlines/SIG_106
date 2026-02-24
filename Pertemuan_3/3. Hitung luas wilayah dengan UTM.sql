SELECT 
  nama,
  ST_Area(ST_Transform(geom, 32748)) as luas_m2,
  ST_Area(ST_Transform(geom, 32748)) / 10000 as luas_ha,
  ST_Area(ST_Transform(geom, 32748)) / 1000000 as luas_km2
FROM wilayah;