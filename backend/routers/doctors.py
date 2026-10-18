from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from database import engine
from dependencies import require_role
from auth import hash_password
from scheduler import optimize_replacement_doctor

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
    reassigned = []

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

            doctor = connection.execute(
                text("""
                    SELECT id, hospital_id, department_id, is_active
                    FROM doctors
                    WHERE id = :doctor_id
                      AND hospital_id = :hospital_id
                    FOR UPDATE
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

            if not doctor.is_active:
                raise HTTPException(
                    status_code=400,
                    detail="Doctor is already inactive"
                )

            appointments = connection.execute(
                text("""
                    SELECT id, appointment_date
                    FROM appointments
                    WHERE doctor_id = :doctor_id
                      AND status = 'scheduled'
                      AND appointment_date > NOW()
                    ORDER BY appointment_date
                    FOR UPDATE
                """),
                {"doctor_id": doctor_id}
            ).fetchall()

            for appointment in appointments:
                busy_rows = connection.execute(
                    text("""
                        SELECT doctor_id
                        FROM appointments
                        WHERE appointment_date = :appointment_date
                          AND status = 'scheduled'
                    """),
                    {
                        "appointment_date": appointment.appointment_date
                    }
                ).fetchall()

                busy_ids = {row.doctor_id for row in busy_rows}

                candidates = connection.execute(
                    text("""
                        SELECT
                            d.id,
                            (
                                SELECT COUNT(*)
                                FROM appointments a
                                WHERE a.doctor_id = d.id
                                  AND a.status = 'scheduled'
                            ) AS workload
                        FROM doctors d
                        WHERE d.hospital_id = :hospital_id
                          AND d.department_id = :department_id
                          AND d.is_active = TRUE
                          AND d.id != :doctor_id
                    """),
                    {
                        "hospital_id": doctor.hospital_id,
                        "department_id": doctor.department_id,
                        "doctor_id": doctor_id
                    }
                ).fetchall()

                replacement_id = optimize_replacement_doctor(
                    [
                        {
                            "id": row.id,
                            "workload": row.workload,
                            "is_active": True
                        }
                        for row in candidates
                    ],
                    busy_ids
                )

                if replacement_id is None:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"No replacement available for appointment "
                            f"{appointment.id}. No changes were saved."
                        )
                    )

                result = connection.execute(
                    text("""
                        UPDATE appointments
                        SET doctor_id = :replacement_id,
                            original_doctor_id =
                                COALESCE(original_doctor_id, :old_doctor_id),
                            reassignment_reason = 'Doctor deactivated',
                            reassigned_at = CURRENT_TIMESTAMP
                        WHERE id = :appointment_id
                          AND doctor_id = :old_doctor_id
                          AND status = 'scheduled'
                    """),
                    {
                        "replacement_id": replacement_id,
                        "old_doctor_id": doctor_id,
                        "appointment_id": appointment.id
                    }
                )

                if result.rowcount != 1:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Appointment {appointment.id} changed "
                            "during reassignment. No changes were saved."
                        )
                    )

                reassigned.append({
                    "appointment_id": appointment.id,
                    "new_doctor_id": replacement_id
                })

            connection.execute(
                text("""
                    UPDATE doctors
                    SET is_active = FALSE
                    WHERE id = :doctor_id
                      AND hospital_id = :hospital_id
                """),
                {
                    "doctor_id": doctor_id,
                    "hospital_id": hospital.hospital_id
                }
            )

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=(
                "A booking conflict prevented reassignment. "
                "All changes were rolled back. Refresh availability "
                "and try again."
            )
        )

    return {
        "message": "Doctor deactivated successfully",
        "doctor_id": doctor_id,
        "reassigned_count": len(reassigned),
        "reassigned_appointments": reassigned
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


@router.get("/me")
def get_my_doctor_profile(
    current_user=Depends(require_role("doctor"))
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    doctors.id,
                    users.id AS user_id,
                    users.name,
                    users.email,
                    departments.name AS department,
                    doctors.specialization,
                    doctors.experience_years,
                    doctors.hospital_id,
                    hospitals.name AS hospital_name,
                    doctors.is_active
                FROM doctors
                JOIN users
                    ON doctors.user_id = users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                WHERE doctors.user_id = :user_id
            """),
            {
                "user_id": current_user["user_id"]
            }
        ).fetchone()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    return {
        "id": result.id,
        "user_id": result.user_id,
        "name": result.name,
        "email": result.email,
        "department": result.department,
        "specialization": result.specialization,
        "experience_years": result.experience_years,
        "hospital_id": result.hospital_id,
        "hospital_name": result.hospital_name,
        "is_active": bool(result.is_active)
    }


@router.get("/dashboard")
def get_doctor_dashboard(
    current_user=Depends(require_role("doctor"))
):
    with engine.connect() as connection:

        doctor = connection.execute(
            text("""
                SELECT
                    doctors.id,
                    users.name,
                    users.email,
                    departments.name AS department,
                    doctors.specialization,
                    doctors.experience_years,
                    doctors.hospital_id,
                    hospitals.name AS hospital_name
                FROM doctors
                JOIN users
                    ON doctors.user_id = users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                WHERE doctors.user_id = :user_id
            """),
            {
                "user_id": current_user["user_id"]
            }
        ).fetchone()

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )

        total_patients = connection.execute(
            text("""
                SELECT COUNT(DISTINCT patient_id)
                FROM appointments
                WHERE doctor_id = :doctor_id
            """),
            {
                "doctor_id": doctor.id
            }
        ).scalar()

        today_appointments = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    appointments.appointment_date,
                    appointments.symptoms,
                    appointments.status,
                    patients.id AS patient_id,
                    users.name AS patient_name,
                    patients.date_of_birth,
                    patients.gender,
                    patients.phone
                FROM appointments
                JOIN patients
                    ON appointments.patient_id = patients.id
                JOIN users
                    ON patients.user_id = users.id
                WHERE appointments.doctor_id = :doctor_id
                AND DATE(appointments.appointment_date) = CURDATE()
                ORDER BY appointments.appointment_date
            """),
            {
                "doctor_id": doctor.id
            }
        ).fetchall()

        completed_count = connection.execute(
            text("""
                SELECT COUNT(*)
                FROM appointments
                WHERE doctor_id = :doctor_id
                AND status = 'completed'
            """),
            {
                "doctor_id": doctor.id
            }
        ).scalar()

        upcoming_count = connection.execute(
            text("""
                SELECT COUNT(*)
                FROM appointments
                WHERE doctor_id = :doctor_id
                AND status = 'scheduled'
                AND appointment_date >= NOW()
            """),
            {
                "doctor_id": doctor.id
            }
        ).scalar()

        appointments = []

        for row in today_appointments:
            appointments.append({
                "id": row.id,
                "appointment_date": row.appointment_date,
                "symptoms": row.symptoms,
                "status": row.status,
                "patient_id": row.patient_id,
                "patient_name": row.patient_name,
                "date_of_birth": row.date_of_birth,
                "gender": row.gender,
                "phone": row.phone
            })

    return {
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email,
            "department": doctor.department,
            "specialization": doctor.specialization,
            "experience_years": doctor.experience_years,
            "hospital_id": doctor.hospital_id,
            "hospital_name": doctor.hospital_name
        },
        "statistics": {
            "total_patients": total_patients or 0,
            "today_appointments": len(appointments),
            "completed": completed_count or 0,
            "upcoming": upcoming_count or 0
        },
        "appointments": appointments
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


@router.get("/hospital/{doctor_id}/reschedule-preview")
def preview_rescheduling(
    doctor_id: int,
    current_user=Depends(require_role("hospital_admin"))
):
    with engine.connect() as connection:
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
                SELECT id, hospital_id, department_id
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

        appointments = connection.execute(
            text("""
                SELECT id, appointment_date
                FROM appointments
                WHERE doctor_id = :doctor_id
                  AND status = 'scheduled'
                  AND appointment_date > NOW()
                ORDER BY appointment_date
            """),
            {"doctor_id": doctor_id}
        ).fetchall()

        previews = []

        for appointment in appointments:
            busy_rows = connection.execute(
                text("""
                    SELECT doctor_id
                    FROM appointments
                    WHERE appointment_date = :appointment_date
                      AND status = 'scheduled'
                """),
                {"appointment_date": appointment.appointment_date}
            ).fetchall()

            busy_ids = {row.doctor_id for row in busy_rows}

            candidates = connection.execute(
                text("""
                    SELECT d.id,
                           (SELECT COUNT(*)
                            FROM appointments a
                            WHERE a.doctor_id = d.id
                              AND a.status = 'scheduled') AS workload
                    FROM doctors d
                    WHERE d.hospital_id = :hospital_id
                      AND d.department_id = :department_id
                      AND d.is_active = TRUE
                      AND d.id != :doctor_id
                """),
                {
                    "hospital_id": doctor.hospital_id,
                    "department_id": doctor.department_id,
                    "doctor_id": doctor_id
                }
            ).fetchall()

            replacement = optimize_replacement_doctor(
                [
                    {
                        "id": row.id,
                        "workload": row.workload,
                        "is_active": True
                    }
                    for row in candidates
                ],
                busy_ids
            )

            previews.append({
                "appointment_id": appointment.id,
                "appointment_date": str(appointment.appointment_date),
                "replacement_doctor_id": replacement,
                "can_reassign": replacement is not None
            })

    return {
        "doctor_id": doctor_id,
        "appointments_checked": len(previews),
        "previews": previews
    }
