from fastapi import APIRouter
from sqlalchemy import text
from database import engine

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.get("/")
def get_patients():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    patients.id,
                    users.name,
                    users.email,
                    patients.date_of_birth,
                    patients.gender,
                    patients.phone
                FROM patients
                JOIN users ON patients.user_id = users.id
            """)
        )

        patients = [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "date_of_birth": str(row.date_of_birth) if row.date_of_birth else None,
                "gender": row.gender,
                "phone": row.phone
            }
            for row in result
        ]

    return patients