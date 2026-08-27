from fastapi import APIRouter
from sqlalchemy import text
from database import engine

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


@router.get("/")
def get_doctors():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    doctors.id,
                    users.name,
                    users.email,
                    departments.name AS department,
                    doctors.specialization,
                    doctors.experience_years
                FROM doctors
                JOIN users ON doctors.user_id = users.id
                JOIN departments ON doctors.department_id = departments.id
            """)
        )

        doctors = [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "department": row.department,
                "specialization": row.specialization,
                "experience_years": row.experience_years
            }
            for row in result
        ]

    return doctors