SELECT
    nama,
    jenis,
    ROUND(
        ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(105.3152, -5.3582), 4326)::geography
        ) / 1000, 2
    ) AS jarak_dari_itera_km
FROM fasilitas_publik
WHERE nama != 'ITERA - Institut Teknologi Sumatera'
ORDER BY jarak_dari_itera_km;