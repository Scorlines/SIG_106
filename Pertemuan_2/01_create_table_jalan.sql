CREATE TABLE IF NOT EXISTS jalan (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50),   -- arteri, kolektor, lokal
    geom    GEOMETRY(LineString, 4326)
);

-- Insert minimal 3 data jalan di sekitar ITERA
INSERT INTO jalan (nama, jenis, geom) VALUES
(
    'Jl. Terusan Ryacudu',
    'Arteri',
    ST_GeomFromText(
        'LINESTRING(105.3000 -5.3600, 105.3080 -5.3590, 
                    105.3152 -5.3582, 105.3230 -5.3570)',
        4326
    )
),
(
    'Jl. ZA Pagar Alam',
    'Arteri',
    ST_GeomFromText(
        'LINESTRING(105.2600 -5.3800, 105.2650 -5.3830,
                    105.2700 -5.3860, 105.2750 -5.3890)',
        4326
    )
),
(
    'Jl. Pramuka',
    'Kolektor',
    ST_GeomFromText(
        'LINESTRING(105.2750 -5.3750, 105.2770 -5.3770,
                    105.2790 -5.3790, 105.2810 -5.3810)',
        4326
    )
),
(
    'Jl. Raya Jati Agung',
    'Lokal',
    ST_GeomFromText(
        'LINESTRING(105.3100 -5.3700, 105.3150 -5.3720,
                    105.3210 -5.3725, 105.3260 -5.3730)',
        4326
    )
);