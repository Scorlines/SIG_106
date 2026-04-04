-- VERIFIKASI INDEKS
-- Menampilkan daftar index yang berhasil dibuat beserta nama tabel dan ukurannya
-- Hasil query ini memastikan ketiga spatial index sudah aktif dan siap digunakan

SELECT 
    indexname, 
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS ukuran
FROM pg_indexes
WHERE indexname IN (
    'idx_rumah_sakit_geom',
    'idx_jalan_geom',
    'idx_wilayah_geom'
)
ORDER BY tablename;