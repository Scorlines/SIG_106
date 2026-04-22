"""
routers/auth.py
===============
Endpoint autentikasi: register dan login pengguna.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from Database import get_pool
from models import UserCreate, Token
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Daftarkan pengguna baru",
    description=(
        "Mendaftarkan akun baru dengan username unik dan password. "
        "Password disimpan sebagai hash bcrypt — tidak pernah plaintext."
    ),
)
async def register(data: UserCreate):
    """
    **Register** — Buat akun pengguna baru.

    - `username` minimal 3 karakter, harus unik.
    - `password` minimal 6 karakter, akan di-hash dengan bcrypt.

    Mengembalikan data user yang baru dibuat (tanpa password).
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Cek apakah username sudah ada
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE username = $1", data.username
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{data.username}' sudah digunakan"
            )

        # Simpan user baru dengan password yang sudah di-hash
        hashed = hash_password(data.password)
        row = await conn.fetchrow(
            """
            INSERT INTO users (username, hashed_password)
            VALUES ($1, $2)
            RETURNING id, username, created_at
            """,
            data.username,
            hashed,
        )
    return {
        "id": row["id"],
        "username": row["username"],
        "created_at": row["created_at"],
        "message": "Registrasi berhasil! Silakan login.",
    }


@router.post(
    "/login",
    response_model=Token,
    summary="Login dan dapatkan JWT token",
    description=(
        "Login menggunakan username dan password. "
        "Mengembalikan JWT access token yang digunakan untuk endpoint terproteksi."
    ),
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    **Login** — Autentikasi dan dapatkan Bearer token.

    Gunakan token yang dikembalikan di header `Authorization: Bearer <token>`
    untuk mengakses endpoint POST/PUT/DELETE fasilitas.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, username, hashed_password FROM users WHERE username = $1",
            form_data.username,
        )

    # Verifikasi user dan password
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}
