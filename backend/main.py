from fastapi import FastAPI
from sqlalchemy import text
from database import engine
from routers import departments

app = FastAPI()

app.include_router(departments.router)


@app.get("/")
def read_root():
    return {"message": "MediFlow AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-test")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "MySQL database connected successfully"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }