INSERT INTO fasilitas_publik (nama, jenis, alamat, geom) VALUES
(
    'ITERA - Institut Teknologi Sumatera',
    'Kampus',
    'Jl. Terusan Ryacudu, Way Hui, Jati Agung, Lampung Selatan',
    ST_SetSRID(ST_MakePoint(105.3152, -5.3582), 4326)
),
(
    'RS Urip Sumoharjo',
    'Rumah Sakit',
    'Jl. Urip Sumoharjo No.200, Sukarame, Bandar Lampung',
    ST_SetSRID(ST_MakePoint(105.2574, -5.3912), 4326)
),
(
    'Masjid Al-Ikhlas ITERA',
    'Masjid',
    'Lingkungan Kampus ITERA, Way Hui, Jati Agung',
    ST_SetSRID(ST_MakePoint(105.3140, -5.3570), 4326)
),
(
    'SMA Negeri 14 Bandar Lampung',
    'Sekolah',
    'Jl. Pagar Alam No.18, Kedaton, Bandar Lampung',
    ST_SetSRID(ST_MakePoint(105.2611, -5.3875), 4326)
),
(
    'Puskesmas Jati Agung',
    'Puskesmas',
    'Jl. Jati Agung, Lampung Selatan',
    ST_SetSRID(ST_MakePoint(105.3088, -5.3651), 4326)
),
(
    'Pasar Sukarame',
    'Pasar',
    'Jl. Pramuka, Sukarame, Bandar Lampung',
    ST_SetSRID(ST_MakePoint(105.2782, -5.3790), 4326)
),
(
    'Kantor Kecamatan Jati Agung',
    'Kantor Pemerintah',
    'Jl. Raya Jati Agung, Lampung Selatan',
    ST_SetSRID(ST_MakePoint(105.3211, -5.3725), 4326)
);