
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from database import engine
from dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def require_patient(current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can access notifications"
        )
    return current_user


@router.get("/")
def get_notifications(current_user=Depends(require_patient)):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT id, appointment_id, title, message, type,
                       is_read, created_at
                FROM notifications
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": current_user["user_id"]}
        )

        return [dict(row._mapping) for row in result]


@router.get("/unread-count")
def get_unread_count(current_user=Depends(require_patient)):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT COUNT(*)
                FROM notifications
                WHERE user_id = :user_id
                  AND is_read = FALSE
            """),
            {"user_id": current_user["user_id"]}
        )

        return {"unread_count": result.scalar_one()}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user=Depends(require_patient)
):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                UPDATE notifications
                SET is_read = TRUE
                WHERE id = :notification_id
                  AND user_id = :user_id
            """),
            {
                "notification_id": notification_id,
                "user_id": current_user["user_id"]
            }
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )

    return {"message": "Notification marked as read"}
