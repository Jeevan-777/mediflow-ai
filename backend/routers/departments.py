from fastapi import APIRouter
from sqlalchemy import text
from database import engine

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.get("/")
def get_departments():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT id, name, description FROM departments")
        )

        departments = [
            {
                "id": row.id,
                "name": row.name,
                "description": row.description
            }
            for row in result
        ]

    return departments