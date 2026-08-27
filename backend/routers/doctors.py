from fastapi import APIRouter, HTTPException
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

@router.get("/recommend/{department_id}")
def recommend_doctor(department_id: int):

    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    doctors.id,
                    users.name,
                    doctors.experience_years,
                    COUNT(appointments.id) AS appointment_count
                FROM doctors
                JOIN users ON doctors.user_id = users.id
                LEFT JOIN appointments
                    ON doctors.id = appointments.doctor_id
                    AND appointments.status = 'scheduled'
                WHERE doctors.department_id = :department_id
                GROUP BY doctors.id, users.name, doctors.experience_years
            """),
            {"department_id": department_id}
        )

        doctors = []

        for row in result:
            score = (row.experience_years * 10) - (row.appointment_count * 5)

            doctors.append({
                "id": row.id,
                "name": row.name,
                "experience_years": row.experience_years,
                "current_appointments": row.appointment_count,
                "score": score
            })

    if not doctors:
        raise HTTPException(
            status_code=404,
            detail="No doctors found in this department"
        )

    best_doctor = max(doctors, key=lambda doctor: doctor["score"])

    return {
        "department_id": department_id,
        "recommended_doctor": best_doctor
    }