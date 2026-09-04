import os
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from sqlalchemy import text

from database import engine


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


router = APIRouter(
    prefix="/symptoms",
    tags=["Symptoms"]
)


class SymptomInput(BaseModel):
    symptoms: str
    appointment_date: datetime


@router.post("/analyze")
def analyze_symptoms(symptom_data: SymptomInput):

    prompt = f"""
You are an AI assistant in an academic healthcare project called MediFlow AI.

Analyze the patient's symptoms and return ONLY valid JSON.
Do not include markdown, code blocks, or any extra text.

Use exactly this format:

{{
    "possible_condition": "short preliminary suggestion",
    "recommended_department": "one department only",
    "urgency": "low, medium, or high",
    "disclaimer": "This is not a medical diagnosis."
}}

Rules:
1. Do not provide a confirmed medical diagnosis.
2. Keep all values short and easy to read.
3. Recommend only one department from this list:
   General Medicine, Cardiology, Orthopedics, Dermatology, ENT, Neurology.
4. Urgency must be only: low, medium, or high.
5. Keep the disclaimer short.

Patient symptoms:
"{symptom_data.symptoms}"
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        ai_result = json.loads(response.text)

        department_name = ai_result["recommended_department"]

        with engine.connect() as connection:
            department_result = connection.execute(
                text("""
                    SELECT id
                    FROM departments
                    WHERE name = :department_name
                """),
                {"department_name": department_name}
            ).fetchone()

        if not department_result:
            raise HTTPException(
                status_code=404,
                detail="Recommended department not found"
            )

        department_id = department_result.id

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
                    AND doctors.id NOT IN (
                        SELECT doctor_id
                        FROM appointments
                        WHERE appointment_date = :appointment_date
                        AND status = 'scheduled'
                    )
                    GROUP BY
                        doctors.id,
                        users.name,
                        doctors.experience_years
                """),
                {
                    "department_id": department_id,
                    "appointment_date": symptom_data.appointment_date
                }
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
                detail="No doctors found in the recommended department"
            )

        best_doctor = max(
            doctors,
            key=lambda doctor: doctor["score"]
        )

        return {
            "symptoms": symptom_data.symptoms,
            **ai_result,
            "recommended_doctor": best_doctor
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )