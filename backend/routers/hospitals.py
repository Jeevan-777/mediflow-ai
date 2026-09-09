from fastapi import APIRouter
from sqlalchemy import text
from database import engine

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospitals"]
)


@router.get("/")
def get_hospitals():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    id,
                    name,
                    address,
                    city,
                    phone
                FROM hospitals
                ORDER BY name
            """)
        )

        hospitals = [
            {
                "id": row.id,
                "name": row.name,
                "address": row.address,
                "city": row.city,
                "phone": row.phone
            }
            for row in result
        ]

    return hospitals