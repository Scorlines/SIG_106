-- VACUUM ANALYZE
-- Memperbarui statistik tabel sehingga query planner PostgreSQL dapat membuat  
-- keputusan eksekusi yang lebih optimal dan memanfaatkan index secara maksimal

-- VACUUM ANALYZE untuk tabel rumah_sakit
VACUUM ANALYZE rumah_sakit;

-- VACUUM ANALYZE untuk tabel jalan
VACUUM ANALYZE jalan;

-- VACUUM ANALYZE untuk tabel wilayah
VACUUM ANALYZE wilayah;