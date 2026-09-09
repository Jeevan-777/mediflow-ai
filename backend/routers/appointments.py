from fastapi import APIRouter, HTTPException, Depends
from dependencies import require_role
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from database import engine
from datetime import datetime


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    hospital_id: int
    appointment_date: datetime
    symptoms: str | None = None


@router.post("/")
def create_appointment(
    appointment: AppointmentCreate,
    current_user=Depends(require_role("patient"))
):
    try:
        with engine.begin() as connection:

            patient = connection.execute(
                text("""
                    SELECT id
                    FROM patients
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": current_user["user_id"]
                }
            ).fetchone()

            if not patient:
                raise HTTPException(
                    status_code=404,
                    detail="Patient profile not found"
                )

            hospital = connection.execute(
                text("""
                    SELECT id, name, address, city, phone
                    FROM hospitals
                    WHERE id = :hospital_id
                """),
                {
                    "hospital_id": appointment.hospital_id
                }
            ).fetchone()

            if not hospital:
                raise HTTPException(
                    status_code=404,
                    detail="Hospital not found"
                )

            doctor = connection.execute(
                text("""
                    SELECT
                        doctors.id,
                        users.name AS doctor_name,
                        doctors.hospital_id,
                        departments.name AS department
                    FROM doctors
                    JOIN users
                        ON doctors.user_id = users.id
                    JOIN departments
                        ON doctors.department_id = departments.id
                    WHERE doctors.id = :doctor_id
                """),
                {
                    "doctor_id": appointment.doctor_id
                }
            ).fetchone()

            if not doctor:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )

            if doctor.hospital_id != appointment.hospital_id:
                raise HTTPException(
                    status_code=400,
                    detail="Selected doctor does not belong to the selected hospital"
                )

            connection.execute(
                text("""
                    INSERT INTO appointments
                    (
                        patient_id,
                        doctor_id,
                        appointment_date,
                        symptoms
                    )
                    VALUES
                    (
                        :patient_id,
                        :doctor_id,
                        :appointment_date,
                        :symptoms
                    )
                """),
                {
                    "patient_id": patient.id,
                    "doctor_id": appointment.doctor_id,
                    "appointment_date": appointment.appointment_date,
                    "symptoms": appointment.symptoms
                }
            )

        return {
            "message": "Appointment created successfully",
            "hospital_id": hospital.id,
            "hospital_name": hospital.name,
            "hospital_address": hospital.address,
            "hospital_city": hospital.city,
            "doctor_id": doctor.id,
            "doctor_name": doctor.doctor_name,
            "department": doctor.department
        }

    except HTTPException:
        raise

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Doctor already has an appointment at this time"
        )


@router.get("/")
def get_appointments():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    patients.id AS patient_id,
                    patient_users.name AS patient_name,
                    doctors.id AS doctor_id,
                    doctor_users.name AS doctor_name,
                    departments.name AS department,
                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name,
                    hospitals.address AS hospital_address,
                    hospitals.city AS hospital_city,
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms
                FROM appointments
                JOIN patients
                    ON appointments.patient_id = patients.id
                JOIN users AS patient_users
                    ON patients.user_id = patient_users.id
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                JOIN users AS doctor_users
                    ON doctors.user_id = doctor_users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                ORDER BY appointments.appointment_date
            """)
        )

        appointments = [
            {
                "id": row.id,
                "patient_id": row.patient_id,
                "patient_name": row.patient_name,
                "doctor_id": row.doctor_id,
                "doctor_name": row.doctor_name,
                "department": row.department,
                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name,
                "hospital_address": row.hospital_address,
                "hospital_city": row.hospital_city,
                "appointment_date": str(row.appointment_date),
                "status": row.status,
                "symptoms": row.symptoms
            }
            for row in result
        ]

    return appointments


class AppointmentStatusUpdate(BaseModel):
    status: str


@router.get("/doctor")
def get_doctor_appointments(
    current_user=Depends(require_role("doctor"))
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    patients.id AS patient_id,
                    patient_users.name AS patient_name,
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms,
                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name,
                    hospitals.address AS hospital_address,
                    hospitals.city AS hospital_city
                FROM appointments
                JOIN patients
                    ON appointments.patient_id = patients.id
                JOIN users AS patient_users
                    ON patients.user_id = patient_users.id
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                WHERE doctors.user_id = :user_id
                ORDER BY appointments.appointment_date
            """),
            {
                "user_id": current_user["user_id"]
            }
        )

        appointments = [
            {
                "id": row.id,
                "patient_id": row.patient_id,
                "patient_name": row.patient_name,
                "appointment_date": str(row.appointment_date),
                "status": row.status,
                "symptoms": row.symptoms,
                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name,
                "hospital_address": row.hospital_address,
                "hospital_city": row.hospital_city
            }
            for row in result
        ]

    return appointments


@router.get("/hospital")
def get_hospital_appointments(
    current_user=Depends(require_role("hospital_admin"))
):
    with engine.connect() as connection:

        hospital = connection.execute(
            text("""
                SELECT hospital_id
                FROM hospital_admins
                WHERE user_id = :user_id
            """),
            {
                "user_id": current_user["user_id"]
            }
        ).fetchone()

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail="Hospital admin profile not found"
            )

        result = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    patients.id AS patient_id,
                    patient_users.name AS patient_name,
                    doctors.id AS doctor_id,
                    doctor_users.name AS doctor_name,
                    departments.name AS department,
                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name,
                    hospitals.address AS hospital_address,
                    hospitals.city AS hospital_city,
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms
                FROM appointments
                JOIN patients
                    ON appointments.patient_id = patients.id
                JOIN users AS patient_users
                    ON patients.user_id = patient_users.id
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                JOIN users AS doctor_users
                    ON doctors.user_id = doctor_users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                WHERE doctors.hospital_id = :hospital_id
                ORDER BY appointments.appointment_date
            """),
            {
                "hospital_id": hospital.hospital_id
            }
        )

        appointments = [
            {
                "id": row.id,
                "patient_id": row.patient_id,
                "patient_name": row.patient_name,
                "doctor_id": row.doctor_id,
                "doctor_name": row.doctor_name,
                "department": row.department,
                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name,
                "hospital_address": row.hospital_address,
                "hospital_city": row.hospital_city,
                "appointment_date": str(row.appointment_date),
                "status": row.status,
                "symptoms": row.symptoms
            }
            for row in result
        ]

    return appointments


@router.get("/hospital/stats")
def get_hospital_stats(
    current_user=Depends(require_role("hospital_admin"))
):
    with engine.connect() as connection:

        hospital = connection.execute(
            text("""
                SELECT
                    hospitals.id,
                    hospitals.name
                FROM hospital_admins
                JOIN hospitals
                    ON hospital_admins.hospital_id = hospitals.id
                WHERE hospital_admins.user_id = :user_id
            """),
            {
                "user_id": current_user["user_id"]
            }
        ).fetchone()

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail="Hospital admin profile not found"
            )

        doctor_stats = connection.execute(
            text("""
                SELECT
                    COUNT(*) AS total_doctors,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN is_active = TRUE THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS active_doctors
                FROM doctors
                WHERE hospital_id = :hospital_id
            """),
            {
                "hospital_id": hospital.id
            }
        ).fetchone()

        appointment_stats = connection.execute(
            text("""
                SELECT
                    COUNT(*) AS total_appointments,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN DATE(appointment_date) = CURDATE()
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS todays_appointments
                FROM appointments
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                WHERE doctors.hospital_id = :hospital_id
            """),
            {
                "hospital_id": hospital.id
            }
        ).fetchone()

    return {
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "total_doctors": doctor_stats.total_doctors,
        "active_doctors": doctor_stats.active_doctors,
        "total_appointments": appointment_stats.total_appointments,
        "todays_appointments": appointment_stats.todays_appointments
    }


@router.get("/patient")
def get_patient_appointments(
    current_user=Depends(require_role("patient"))
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    doctors.id AS doctor_id,
                    doctor_users.name AS doctor_name,
                    departments.name AS department,
                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name,
                    hospitals.address AS hospital_address,
                    hospitals.city AS hospital_city,
                    hospitals.phone AS hospital_phone,
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms
                FROM appointments
                JOIN patients
                    ON appointments.patient_id = patients.id
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                JOIN users AS doctor_users
                    ON doctors.user_id = doctor_users.id
                JOIN departments
                    ON doctors.department_id = departments.id
                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id
                WHERE patients.user_id = :user_id
                ORDER BY appointments.appointment_date
            """),
            {
                "user_id": current_user["user_id"]
            }
        )

        appointments = [
            {
                "id": row.id,
                "doctor_id": row.doctor_id,
                "doctor_name": row.doctor_name,
                "department": row.department,
                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name,
                "hospital_address": row.hospital_address,
                "hospital_city": row.hospital_city,
                "hospital_phone": row.hospital_phone,
                "appointment_date": str(row.appointment_date),
                "status": row.status,
                "symptoms": row.symptoms
            }
            for row in result
        ]

    return appointments


@router.patch("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    current_user=Depends(require_role("doctor"))
):
    if status_update.status not in [
        "scheduled",
        "completed",
        "cancelled"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    with engine.begin() as connection:

        appointment = connection.execute(
            text("""
                SELECT appointments.id
                FROM appointments
                JOIN doctors
                    ON appointments.doctor_id = doctors.id
                WHERE appointments.id = :appointment_id
                AND doctors.user_id = :user_id
            """),
            {
                "appointment_id": appointment_id,
                "user_id": current_user["user_id"]
            }
        ).fetchone()

        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found or access denied"
            )

        connection.execute(
            text("""
                UPDATE appointments
                SET status = :status
                WHERE id = :appointment_id
            """),
            {
                "status": status_update.status,
                "appointment_id": appointment_id
            }
        )

    return {
        "message": "Appointment status updated successfully"
    }