from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import EnrollmentCreate, EnrollmentResponse
from app.services import enrollment_service

router = APIRouter()

@router.get("/", response_model=List[EnrollmentResponse])
def list_enrollments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return enrollment_service.get_enrollments(db, skip=skip, limit=limit)

@router.post("/", response_model=EnrollmentResponse, status_code=201)
def create_enrollment(enroll_in: EnrollmentCreate, db: Session = Depends(get_db)):
    """Cria uma matrícula e gera a primeira fatura automaticamente."""
    return enrollment_service.create_enrollment(db, enroll_in)
