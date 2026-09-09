from fastapi import APIRouter, Depends
from sqlalchemy import text
from database import engine
from dependencies import require_role

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.get("/")
def get_patients(current_user=Depends(require_role("patient"))):
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
                "date_of_birth": str(row.date_of_birth)
                if row.date_of_birth else None,
                "gender": row.gender,
                "phone": row.phone
            }
            for row in result
        ]

    return patients


@router.get("/dashboard")
def get_patient_dashboard(
    current_user=Depends(require_role("patient"))
):
    with engine.connect() as connection:

        patient_result = connection.execute(
            text("""
                SELECT
                    patients.id AS patient_id,
                    users.name,
                    users.email,

                    COUNT(
                        CASE
                            WHEN appointments.status = 'scheduled'
                            AND appointments.appointment_date >= NOW()
                            THEN appointments.id
                        END
                    ) AS upcoming_appointments,

                    COUNT(
                        CASE
                            WHEN appointments.status = 'completed'
                            THEN appointments.id
                        END
                    ) AS completed_appointments

                FROM patients

                JOIN users
                    ON patients.user_id = users.id

                LEFT JOIN appointments
                    ON appointments.patient_id = patients.id

                WHERE patients.user_id = :user_id

                GROUP BY
                    patients.id,
                    users.name,
                    users.email
            """),
            {
                "user_id": current_user["user_id"]
            }
        ).fetchone()

        if not patient_result:
            return {
                "patient_id": None,
                "name": None,
                "email": None,
                "upcoming_appointments": 0,
                "completed_appointments": 0,
                "appointments": []
            }

        appointment_result = connection.execute(
            text("""
                SELECT
                    appointments.id,
                    appointments.appointment_date,
                    appointments.status,
                    appointments.symptoms,

                    doctors.id AS doctor_id,
                    users.name AS doctor_name,
                    doctors.specialization,

                    departments.name AS department,

                    hospitals.id AS hospital_id,
                    hospitals.name AS hospital_name,
                    hospitals.address AS hospital_address,
                    hospitals.city AS hospital_city,
                    hospitals.phone AS hospital_phone

                FROM appointments

                JOIN doctors
                    ON appointments.doctor_id = doctors.id

                JOIN users
                    ON doctors.user_id = users.id

                JOIN departments
                    ON doctors.department_id = departments.id

                JOIN hospitals
                    ON doctors.hospital_id = hospitals.id

                WHERE appointments.patient_id = :patient_id
                  AND appointments.status = 'scheduled'
                  AND appointments.appointment_date >= NOW()

                ORDER BY appointments.appointment_date ASC
            """),
            {
                "patient_id": patient_result.patient_id
            }
        )

        appointments = [
            {
                "id": row.id,
                "appointment_date": row.appointment_date.isoformat(),
                "status": row.status,
                "symptoms": row.symptoms,

                "doctor_id": row.doctor_id,
                "doctor_name": row.doctor_name,
                "specialization": row.specialization,
                "department": row.department,

                "hospital_id": row.hospital_id,
                "hospital_name": row.hospital_name,
                "hospital_address": row.hospital_address,
                "hospital_city": row.hospital_city,
                "hospital_phone": row.hospital_phone
            }
            for row in appointment_result
        ]

    return {
        "patient_id": patient_result.patient_id,
        "name": patient_result.name,
        "email": patient_result.email,
        "upcoming_appointments": patient_result.upcoming_appointments,
        "completed_appointments": patient_result.completed_appointments,
        "appointments": appointments
    }