
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from pydantic import BaseModel, Field

from database import engine
from dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations")
def get_conversations(
    current_user=Depends(get_current_user)
):
    user_id = current_user["user_id"]
    role = current_user["role"]

    if role not in ("patient", "doctor"):
        raise HTTPException(
            status_code=403,
            detail="Only patients and doctors can access messages"
        )

    with engine.connect() as connection:
        if role == "patient":
            query = """
                SELECT
                    a.id AS appointment_id,
                    a.status,
                    a.appointment_date,
                    d.id AS doctor_id,
                    du.name AS other_name
                FROM appointments a
                JOIN patients p ON p.id = a.patient_id
                JOIN doctors d ON d.id = a.doctor_id
                JOIN users du ON du.id = d.user_id
                WHERE p.user_id = :user_id
                  AND a.status IN ('scheduled', 'completed')
                ORDER BY a.appointment_date DESC
            """
        else:
            query = """
                SELECT
                    a.id AS appointment_id,
                    a.status,
                    a.appointment_date,
                    p.id AS patient_id,
                    pu.name AS other_name
                FROM appointments a
                JOIN doctors d ON d.id = a.doctor_id
                JOIN patients p ON p.id = a.patient_id
                JOIN users pu ON pu.id = p.user_id
                WHERE d.user_id = :user_id
                  AND a.status IN ('scheduled', 'completed')
                ORDER BY a.appointment_date DESC
            """

        result = connection.execute(
            text(query),
            {"user_id": user_id}
        ).mappings().all()

    return {
        "conversations": [dict(row) for row in result]
    }



class MessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


@router.post("/{appointment_id}")
def send_message(
    appointment_id: int,
    data: MessageCreate,
    current_user=Depends(get_current_user)
):
    user_id = current_user["user_id"]
    role = current_user["role"]
    content = data.message.strip()

    if role not in ("patient", "doctor"):
        raise HTTPException(
            status_code=403,
            detail="Only patients and doctors can send messages"
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    with engine.begin() as connection:
        appointment = connection.execute(
            text("""
                SELECT
                    a.id,
                    a.patient_id,
                    a.doctor_id,
                    a.status,
                    p.user_id AS patient_user_id,
                    d.user_id AS doctor_user_id
                FROM appointments a
                JOIN patients p ON p.id = a.patient_id
                JOIN doctors d ON d.id = a.doctor_id
                WHERE a.id = :appointment_id
                FOR UPDATE
            """),
            {"appointment_id": appointment_id}
        ).mappings().first()

        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

        if appointment["status"] == "cancelled":
            raise HTTPException(
                status_code=403,
                detail="Messaging is unavailable for cancelled appointments"
            )

        if role == "patient":
            if appointment["patient_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="This appointment does not belong to you"
                )
            receiver_id = appointment["doctor_user_id"]

        else:
            if appointment["doctor_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="You are not the doctor assigned to this appointment"
                )
            receiver_id = appointment["patient_user_id"]

        result = connection.execute(
            text("""
                INSERT INTO messages (
                    sender_user_id,
                    receiver_user_id,
                    appointment_id,
                    message
                )
                VALUES (
                    :sender_id,
                    :receiver_id,
                    :appointment_id,
                    :message
                )
            """),
            {
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "appointment_id": appointment_id,
                "message": content
            }
        )

        message_id = result.lastrowid

        saved_message = connection.execute(
            text("""
                SELECT id, sender_user_id, receiver_user_id,
                       appointment_id, message, sent_at, is_read
                FROM messages
                WHERE id = :message_id
            """),
            {"message_id": message_id}
        ).mappings().first()

    return dict(saved_message)



@router.get("/{appointment_id}")
def get_message_history(
    appointment_id: int,
    current_user=Depends(get_current_user)
):
    user_id = current_user["user_id"]
    role = current_user["role"]

    if role not in ("patient", "doctor"):
        raise HTTPException(
            status_code=403,
            detail="Only patients and doctors can access messages"
        )

    with engine.connect() as connection:
        appointment = connection.execute(
            text("""
                SELECT
                    a.id,
                    a.status,
                    p.user_id AS patient_user_id,
                    d.user_id AS doctor_user_id
                FROM appointments a
                JOIN patients p ON p.id = a.patient_id
                JOIN doctors d ON d.id = a.doctor_id
                WHERE a.id = :appointment_id
            """),
            {"appointment_id": appointment_id}
        ).mappings().first()

        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

        if role == "patient":
            authorized = appointment["patient_user_id"] == user_id
        else:
            authorized = appointment["doctor_user_id"] == user_id

        if not authorized:
            raise HTTPException(
                status_code=403,
                detail="You cannot access this conversation"
            )

        messages = connection.execute(
            text("""
                SELECT id, sender_user_id, receiver_user_id,
                       appointment_id, message, sent_at, is_read
                FROM messages
                WHERE appointment_id = :appointment_id
                  AND (
                      (sender_user_id = :patient_user_id
                       AND receiver_user_id = :doctor_user_id)
                      OR
                      (sender_user_id = :doctor_user_id
                       AND receiver_user_id = :patient_user_id)
                  )
                ORDER BY sent_at ASC, id ASC
            """),
            {
                "appointment_id": appointment_id,
                "patient_user_id": appointment["patient_user_id"],
                "doctor_user_id": appointment["doctor_user_id"]
            }
        ).mappings().all()

    return {"messages": [dict(message) for message in messages]}



@router.patch("/{appointment_id}/read")
def mark_messages_read(
    appointment_id: int,
    current_user=Depends(get_current_user)
):
    user_id = current_user["user_id"]
    role = current_user["role"]

    if role not in ("patient", "doctor"):
        raise HTTPException(
            status_code=403,
            detail="Only patients and doctors can mark messages as read"
        )

    with engine.begin() as connection:
        appointment = connection.execute(
            text("""
                SELECT
                    p.user_id AS patient_user_id,
                    d.user_id AS doctor_user_id
                FROM appointments a
                JOIN patients p ON p.id = a.patient_id
                JOIN doctors d ON d.id = a.doctor_id
                WHERE a.id = :appointment_id
            """),
            {"appointment_id": appointment_id}
        ).mappings().first()

        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

        if role == "patient":
            if appointment["patient_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot access this conversation"
                )
        elif appointment["doctor_user_id"] != user_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access this conversation"
            )

        result = connection.execute(
            text("""
                UPDATE messages
                SET is_read = TRUE
                WHERE appointment_id = :appointment_id
                  AND receiver_user_id = :user_id
                  AND is_read = FALSE
            """),
            {
                "appointment_id": appointment_id,
                "user_id": user_id
            }
        )

    return {
        "message": "Messages marked as read",
        "updated_count": result.rowcount
    }
