CREATE TABLE IF NOT EXISTS wilayah (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50),   -- kelurahan, kecamatan, dll
    geom    GEOMETRY(Polygon, 4326)
);

-- Insert minimal 2 data wilayah kelurahan
INSERT INTO wilayah (nama, jenis, geom) VALUES
(
    'Kelurahan Way Hui',
    'Kelurahan',
    ST_GeomFromText(
        'POLYGON((
            105.3050 -5.3500,
            105.3250 -5.3500,
            105.3250 -5.3700,
            105.3050 -5.3700,
            105.3050 -5.3500
        ))',
        4326
    )
),
(
    'Kelurahan Sukarame',
    'Kelurahan',
    ST_GeomFromText(
        'POLYGON((
            105.2650 -5.3750,
            105.2900 -5.3750,
            105.2900 -5.3950,
            105.2650 -5.3950,
            105.2650 -5.3750
        ))',
        4326
    )
),
(
    'Kelurahan Jati Agung',
    'Kelurahan',
    ST_GeomFromText(
        'POLYGON((
            105.3100 -5.3650,
            105.3300 -5.3650,
            105.3300 -5.3850,
            105.3100 -5.3850,
            105.3100 -5.3650
        ))',
        4326
    )
);