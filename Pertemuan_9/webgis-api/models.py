"""
models.py
=========
Pydantic models untuk validasi request/response WebGIS API.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Fasilitas ─────────────────────────────────────────────────────────────────

class FasilitasCreate(BaseModel):
    """
    Schema untuk membuat atau mengganti fasilitas publik.
    Semua field wajib diisi kecuali `alamat`.
    """
    nama: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Nama fasilitas (minimal 3 karakter)"
    )
    jenis: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Kategori fasilitas, contoh: Rumah Sakit, Sekolah, Masjid"
    )
    alamat: Optional[str] = Field(
        None,
        max_length=255,
        description="Alamat lengkap fasilitas (opsional)"
    )
    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Koordinat bujur (longitude) dalam derajat desimal"
    )
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Koordinat lintang (latitude) dalam derajat desimal"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "nama": "RSUD Ujungberung",
                "jenis": "Rumah Sakit",
                "alamat": "Jl. Rumah Sakit No.1, Ujungberung, Bandung",
                "longitude": 107.7053,
                "latitude": -6.9167
            }
        }


class FasilitasUpdate(BaseModel):
    """
    Schema untuk memperbarui sebagian field fasilitas (PATCH-style).
    Semua field bersifat opsional — hanya field yang dikirim yang akan diubah.
    """
    nama: Optional[str] = Field(None, min_length=3, max_length=100)
    jenis: Optional[str] = Field(None, min_length=2, max_length=50)
    alamat: Optional[str] = Field(None, max_length=255)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    latitude: Optional[float] = Field(None, ge=-90, le=90)


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """
    Schema untuk registrasi pengguna baru.
    Password disimpan sebagai hash — tidak pernah disimpan plaintext.
    """
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Nama pengguna unik (3–50 karakter)"
    )
    password: str = Field(
        ...,
        min_length=6,
        description="Password minimal 6 karakter"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin_bandung",
                "password": "rahasia123"
            }
        }


class Token(BaseModel):
    """
    Schema response untuk endpoint login.
    Kembalikan JWT access token dan tipe token.
    """
    access_token: str = Field(..., description="JWT Bearer token")
    token_type: str = Field(default="bearer", description="Tipe token, selalu 'bearer'")