from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from database import engine
from auth import verify_password, hash_password
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


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


@router.post("/register")
def register(register_data: RegisterRequest):

    if not register_data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    if not register_data.email.strip():
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if not register_data.password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    try:
        with engine.begin() as connection:

            existing_user = connection.execute(
                text("""
                    SELECT id
                    FROM users
                    WHERE email = :email
                """),
                {
                    "email": register_data.email
                }
            ).fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )

            password_hash = hash_password(
                register_data.password
            )

            result = connection.execute(
                text("""
                    INSERT INTO users
                    (
                        name,
                        email,
                        password_hash,
                        role
                    )
                    VALUES
                    (
                        :name,
                        :email,
                        :password_hash,
                        'patient'
                    )
                """),
                {
                    "name": register_data.name,
                    "email": register_data.email,
                    "password_hash": password_hash
                }
            )

            user_id = result.lastrowid

            connection.execute(
                text("""
                    INSERT INTO patients
                    (
                        user_id
                    )
                    VALUES
                    (
                        :user_id
                    )
                """),
                {
                    "user_id": user_id
                }
            )

        return {
            "message": "Registration successful"
        }

    except HTTPException:
        raise

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
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
            {
                "email": login_data.username
            }
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

    token_data = {
        "user_id": result.id,
        "role": result.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }

    access_token = jwt.encode(
        token_data,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user_id": result.id,
        "name": result.name,
        "email": result.email,
        "role": result.role
    }