CREATE TABLE IF NOT EXISTS fasilitas_publik (
    id      SERIAL PRIMARY KEY,
    nama    VARCHAR(150) NOT NULL,
    jenis   VARCHAR(50)  NOT NULL,
    alamat  TEXT,
    geom    GEOMETRY(Point, 4326)
);