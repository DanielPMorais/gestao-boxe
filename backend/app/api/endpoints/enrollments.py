from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import EnrollmentCreate, EnrollmentResponse, EnrollmentUpgrade
from app.services import enrollment_service

router = APIRouter()

@router.get("/", response_model=List[EnrollmentResponse])
def list_enrollments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return enrollment_service.get_enrollments(db, skip=skip, limit=limit)

@router.post("/", response_model=EnrollmentResponse, status_code=201)
def create_enrollment(enroll_in: EnrollmentCreate, db: Session = Depends(get_db)):
    """Cria uma matrícula e gera a primeira fatura automaticamente."""
    return enrollment_service.create_enrollment(db, enroll_in)

@router.get("/{id}/upgrade-preview")
def upgrade_preview(id: str, new_plan_id: str, db: Session = Depends(get_db)):
    """Calcula quanto o aluno deve pagar para mudar para o novo plano."""
    return enrollment_service.calculate_upgrade_info(db, id, new_plan_id)

@router.post("/{id}/upgrade", response_model=EnrollmentResponse)
def execute_upgrade(id: str, upgrade_in: EnrollmentUpgrade, db: Session = Depends(get_db)):
    """Executa a troca de plano, desativa a anterior e gera fatura proporcional."""
    return enrollment_service.upgrade_enrollment(db, id, upgrade_in.new_plan_id, upgrade_in.signature_base64)
