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


class DoctorUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    department_id: int | None = None
    specialization: str | None = None
    experience_years: int | None = None


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
                    doctors.experience_years,
                    doctors.hospital_id,
                    doctors.is_active
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
                "experience_years": row.experience_years,
                "hospital_id": row.hospital_id,
                "is_active": bool(row.is_active)
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
                    doctors.is_active,
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
                "is_active": bool(row.is_active),
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
                        hospital_id,
                        is_active
                    )
                    VALUES
                    (
                        :user_id,
                        :department_id,
                        :specialization,
                        :experience_years,
                        :hospital_id,
                        TRUE
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


@router.patch("/hospital/{doctor_id}")
def update_hospital_doctor(
    doctor_id: int,
    doctor: DoctorUpdate,
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

            existing_doctor = connection.execute(
                text("""
                    SELECT
                        doctors.id,
                        doctors.user_id,
                        doctors.hospital_id
                    FROM doctors
                    WHERE doctors.id = :doctor_id
                    AND doctors.hospital_id = :hospital_id
                """),
                {
                    "doctor_id": doctor_id,
                    "hospital_id": hospital.hospital_id
                }
            ).fetchone()

            if not existing_doctor:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found in your hospital"
                )

            if doctor.department_id is not None:
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

            update_fields = []
            params = {
                "doctor_id": doctor_id,
                "user_id": existing_doctor.user_id
            }

            if doctor.name is not None:
                update_fields.append("name = :name")
                params["name"] = doctor.name

            if doctor.email is not None:
                update_fields.append("email = :email")
                params["email"] = doctor.email

            if update_fields:
                connection.execute(
                    text(f"""
                        UPDATE users
                        SET {", ".join(update_fields)}
                        WHERE id = :user_id
                    """),
                    params
                )

            doctor_fields = []
            doctor_params = {
                "doctor_id": doctor_id
            }

            if doctor.department_id is not None:
                doctor_fields.append("department_id = :department_id")
                doctor_params["department_id"] = doctor.department_id

            if doctor.specialization is not None:
                doctor_fields.append("specialization = :specialization")
                doctor_params["specialization"] = doctor.specialization

            if doctor.experience_years is not None:
                doctor_fields.append("experience_years = :experience_years")
                doctor_params["experience_years"] = doctor.experience_years

            if doctor_fields:
                connection.execute(
                    text(f"""
                        UPDATE doctors
                        SET {", ".join(doctor_fields)}
                        WHERE id = :doctor_id
                    """),
                    doctor_params
                )

        return {
            "message": "Doctor updated successfully"
        }

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )


@router.patch("/hospital/{doctor_id}/deactivate")
def deactivate_doctor(
    doctor_id: int,
    current_user=Depends(require_role("hospital_admin"))
):
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

        doctor = connection.execute(
            text("""
                SELECT id
                FROM doctors
                WHERE id = :doctor_id
                AND hospital_id = :hospital_id
            """),
            {
                "doctor_id": doctor_id,
                "hospital_id": hospital.hospital_id
            }
        ).fetchone()

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found in your hospital"
            )

        connection.execute(
            text("""
                UPDATE doctors
                SET is_active = FALSE
                WHERE id = :doctor_id
            """),
            {"doctor_id": doctor_id}
        )

    return {
        "message": "Doctor deactivated successfully"
    }

@router.patch("/hospital/{doctor_id}/activate")
def activate_doctor(
    doctor_id: int,
    current_user=Depends(require_role("hospital_admin"))
):
    with engine.begin() as connection:
        admin = connection.execute(
            text("""
                SELECT hospital_id
                FROM hospital_admins
                WHERE user_id = :user_id
            """),
            {"user_id": current_user["user_id"]}
        ).fetchone()

        if not admin:
            raise HTTPException(
                status_code=403,
                detail="Hospital admin record not found"
            )

        doctor = connection.execute(
            text("""
                SELECT id
                FROM doctors
                WHERE id = :doctor_id
                AND hospital_id = :hospital_id
            """),
            {
                "doctor_id": doctor_id,
                "hospital_id": admin.hospital_id
            }
        ).fetchone()

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found in your hospital"
            )

        connection.execute(
            text("""
                UPDATE doctors
                SET is_active = TRUE
                WHERE id = :doctor_id
            """),
            {"doctor_id": doctor_id}
        )

    return {
        "message": "Doctor activated successfully"
    }


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
                JOIN users
                    ON doctors.user_id = users.id
                LEFT JOIN appointments
                    ON doctors.id = appointments.doctor_id
                    AND appointments.status = 'scheduled'
                WHERE doctors.department_id = :department_id
                AND doctors.is_active = TRUE
                GROUP BY
                    doctors.id,
                    users.name,
                    doctors.experience_years
            """),
            {"department_id": department_id}
        )

        doctors = []

        for row in result:
            score = (
                row.experience_years * 10
            ) - (
                row.appointment_count * 5
            )

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
            detail="No active doctors found in this department"
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