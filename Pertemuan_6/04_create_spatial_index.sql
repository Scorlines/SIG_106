-- MEMBUAT SPATIAL INDEX (GiST)
-- Membuat tiga spatial index bertipe GiST pada kolom geom di tabel rumah_sakit, jalan, dan wilayah
-- Index GiST menggunakan struktur R-Tree untuk mempercepat pencarian data spasial

-- Indeks untuk tabel rumah_sakit
CREATE INDEX idx_rumah_sakit_geom ON rumah_sakit USING GIST (geom);

-- Indeks untuk tabel jalan
CREATE INDEX idx_jalan_geom ON jalan USING GIST (geom);

-- Indeks untuk tabel wilayah
CREATE INDEX idx_wilayah_geom ON wilayah USING GIST (geom);