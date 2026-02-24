# Pertemuan 3: Transformasi Koordinat dan Pengukuran dalam SIG

## Deskripsi
Pertemuan ini membahas tentang pentingnya transformasi koordinat dalam Sistem Informasi Geografis (SIG) dan berbagai metode pengukuran jarak serta luas area. Kita akan belajar bagaimana mengkonversi koordinat dari WGS84 ke UTM 48S dan membandingkan akurasi pengukuran menggunakan berbagai pendekatan.

## File dalam Pertemuan Ini

### 1. Transform fasilitas_publik ke UTM 48S.sql
- **Tujuan**: Mengkonversi koordinat fasilitas publik dari WGS84 ke sistem koordinat UTM Zone 48S
- **Output**: Menampilkan koordinat asli (WGS84) dan hasil transformasi (UTM 48S)
- **Fungsi Penting**: `ST_Transform(geom, 32748)`, `ST_AsText()`

### 2. Hitung jarak 3 cara.sql
- **Tujuan**: Membandingkan tiga metode berbeda untuk menghitung jarak antar titik
- **Metode**:
  - **Cara 1**: Tanpa konversi (hasil dalam derajat) - TIDAK AKURAT
  - **Cara 2**: Menggunakan tipe data geography (hasil dalam meter)
  - **Cara 3**: Transformasi ke UTM terlebih dahulu (hasil dalam meter)
- **Fungsi Penting**: `ST_Distance()`, `ST_Transform()`, `::geography`

### 3. Hitung luas wilayah dengan UTM.sql
- **Tujuan**: Menghitung luas area wilayah menggunakan sistem koordinat UTM
- **Output**: Luas dalam meter persegi (m²), hektar (ha), dan kilometer persegi (km²)
- **Fungsi Penting**: `ST_Area()`, `ST_Transform()`

### 4. Tabel perbandingan 3 cara sekaligus.sql
- **Tujuan**: Menampilkan perbandingan ketiga metode perhitungan jarak dalam satu tabel
- **Output**: Jarak dalam derajat, meter (geography), meter (UTM), dan selisih antara metode 2 dan 3
- **Fungsi Penting**: Kombinasi dari file 2 dengan penambahan kolom selisih

### 5. Tampilkan semua hasil dalam 1 laporan.sql
- **Tujuan**: Ringkasan lengkap semua analisis dalam satu laporan terpadu
- **Output**: Gabungan hasil jarak antar fasilitas dan luas wilayah
- **Struktur**: Menggunakan UNION untuk menggabungkan hasil berbeda

## Konsep Utama

### Transformasi Koordinat
- **WGS84**: Sistem koordinat geografis global (latitude/longitude dalam derajat)
- **UTM 48S**: Sistem koordinat proyeksi untuk area Sumatera (dalam meter)
- **Kode EPSG**: 4326 untuk WGS84, 32748 untuk UTM Zone 48S

### Pengukuran Jarak
1. **Tanpa Konversi**: Mengukur jarak Euclidean dalam sistem koordinat geografis
   - **Kelemahan**: Hasil dalam derajat, tidak representatif jarak sebenarnya
2. **Geography**: Menggunakan tipe data geography PostGIS
   - **Keuntungan**: Otomatis menghitung jarak ellipsoid dalam meter
3. **UTM Transform**: Transformasi ke sistem proyeksi planar terlebih dahulu
   - **Keuntungan**: Pengukuran Euclidean dalam meter dengan akurasi tinggi

### Pengukuran Luas
- **Pentingnya UTM**: Sistem proyeksi planar diperlukan untuk menghitung luas area
- **ST_Area()**: Fungsi PostGIS untuk menghitung luas geometri

## Cara Menjalankan

1. Pastikan database PostGIS telah ter-setup dengan tabel `fasilitas_publik` dan `wilayah`
2. Jalankan script secara berurutan dari 1 sampai 5
3. Perhatikan hasil perbandingan akurasi antara berbagai metode
4. File 5 memberikan ringkasan lengkap dari semua analisis

## Kesimpulan
- Transformasi koordinat sangat penting untuk akurasi pengukuran dalam SIG
- UTM memberikan hasil terbaik untuk pengukuran jarak dan luas di area lokal
- Geography type PostGIS memberikan alternatif yang baik untuk pengukuran global
- Selalu gunakan sistem koordinat yang sesuai dengan skala dan lokasi analisis

## Prasyarat
- PostgreSQL dengan ekstensi PostGIS
- Tabel `fasilitas_publik` dan `wilayah` dengan kolom geometri dalam WGS84 (EPSG:4326)