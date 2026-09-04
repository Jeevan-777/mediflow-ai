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
    appointment_date: datetime
    symptoms: str | None = None


@router.post("/")
def create_appointment(appointment: AppointmentCreate,current_user=Depends(require_role("patient"))):

    try:
        with engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO appointments
                    (patient_id, doctor_id, appointment_date, symptoms)
                    VALUES
                    (:patient_id, :doctor_id, :appointment_date, :symptoms)
                """),
                {
                    "patient_id": appointment.patient_id,
                    "doctor_id": appointment.doctor_id,
                    "appointment_date": appointment.appointment_date,
                    "symptoms": appointment.symptoms
                }
            )

        return {
            "message": "Appointment created successfully"
        }

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
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms
                FROM appointments
                JOIN patients ON appointments.patient_id = patients.id
                JOIN users AS patient_users ON patients.user_id = patient_users.id
                JOIN doctors ON appointments.doctor_id = doctors.id
                JOIN users AS doctor_users ON doctors.user_id = doctor_users.id
                JOIN departments ON doctors.department_id = departments.id
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
                "appointment_date": str(row.appointment_date),
                "status": row.status,
                "symptoms": row.symptoms
            }
            for row in result
        ]

    return appointments

class AppointmentStatusUpdate(BaseModel):
    status: str


@router.patch("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate
):
    if status_update.status not in ["scheduled", "completed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    with engine.begin() as connection:
        result = connection.execute(
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

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

    return {
        "message": "Appointment status updated successfully"
    }