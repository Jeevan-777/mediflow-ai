from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import text
from database import engine
from auth import verify_password
import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)



@router.post("/login")
def login(login_data: OAuth2PasswordRequestForm = Depends()):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT id, name, email, password_hash, role
                FROM users
                WHERE email = :email
            """),
            {"email": login_data.username}
        ).fetchone()

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        result.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token_data ={
        "user_id": result.id,
        "role": result.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }

    access_token = jwt.encode(token_data, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user_id": result.id,
        "name": result.name,
        "email": result.email,
        "role": result.role
    }