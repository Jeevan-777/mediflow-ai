from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from database import engine
from dependencies import require_role
from auth import hash_password

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


class DoctorCreate(BaseModel):
    name: str
    email: str
    password: str
    department_id: int
    specialization: str | None = None
    experience_years: int = 0


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


@router.get("/hospital")
def get_hospital_doctors(
    current_user=Depends(require_role("hospital_admin"))
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    doctors.id,
                    users.name,
                    users.email,
                    departments.name AS department,
                    doctors.specialization,
                    doctors.experience_years,
                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name
                FROM hospital_admins
                JOIN hospitals
                    ON hospital_admins.hospital_id = hospitals.id
                JOIN doctors
                    ON doctors.hospital_id = hospitals.id
                JOIN users
                    ON doctors.user_id = users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                WHERE hospital_admins.user_id = :user_id
                ORDER BY doctors.id
            """),
            {"user_id": current_user["user_id"]}
        )

        doctors = [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "department": row.department,
                "specialization": row.specialization,
                "experience_years": row.experience_years,
                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name
            }
            for row in result
        ]

    return doctors


@router.post("/")
def add_doctor(
    doctor: DoctorCreate,
    current_user=Depends(require_role("hospital_admin"))
):
    try:
        with engine.begin() as connection:

            hospital = connection.execute(
                text("""
                    SELECT hospital_id
                    FROM hospital_admins
                    WHERE user_id = :user_id
                """),
                {"user_id": current_user["user_id"]}
            ).fetchone()

            if not hospital:
                raise HTTPException(
                    status_code=404,
                    detail="Hospital admin profile not found"
                )

            department = connection.execute(
                text("""
                    SELECT id
                    FROM departments
                    WHERE id = :department_id
                """),
                {"department_id": doctor.department_id}
            ).fetchone()

            if not department:
                raise HTTPException(
                    status_code=404,
                    detail="Department not found"
                )

            password_hash = hash_password(doctor.password)

            user_result = connection.execute(
                text("""
                    INSERT INTO users
                    (name, email, password_hash, role)
                    VALUES
                    (:name, :email, :password_hash, 'doctor')
                """),
                {
                    "name": doctor.name,
                    "email": doctor.email,
                    "password_hash": password_hash
                }
            )

            user_id = user_result.lastrowid

            doctor_result = connection.execute(
                text("""
                    INSERT INTO doctors
                    (
                        user_id,
                        department_id,
                        specialization,
                        experience_years,
                        hospital_id
                    )
                    VALUES
                    (
                        :user_id,
                        :department_id,
                        :specialization,
                        :experience_years,
                        :hospital_id
                    )
                """),
                {
                    "user_id": user_id,
                    "department_id": doctor.department_id,
                    "specialization": doctor.specialization,
                    "experience_years": doctor.experience_years,
                    "hospital_id": hospital.hospital_id
                }
            )

            doctor_id = doctor_result.lastrowid

        return {
            "message": "Doctor added successfully",
            "doctor_id": doctor_id,
            "hospital_id": hospital.hospital_id
        }

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )


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
            estimated_waiting_time = row.appointment_count * 15

            doctors.append({
                "id": row.id,
                "name": row.name,
                "experience_years": row.experience_years,
                "current_appointments": row.appointment_count,
                "estimated_waiting_time": estimated_waiting_time,
                "score": score
            })

    if not doctors:
        raise HTTPException(
            status_code=404,
            detail="No doctors found in this department"
        )

    best_doctor = max(
        doctors,
        key=lambda doctor: doctor["score"]
    )

    return {
        "department_id": department_id,
        "recommended_doctor": best_doctor,
        "all_doctors": doctors
    }