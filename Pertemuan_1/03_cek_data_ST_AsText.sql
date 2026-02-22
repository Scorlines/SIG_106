SELECT
    id,
    nama,
    jenis,
    alamat,
    ST_AsText(geom) AS koordinat_wkt
FROM fasilitas_publik
ORDER BY id;