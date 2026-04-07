from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.schemas.domain import CheckinCreate, CheckinResponse
from app.services import checkin_service

router = APIRouter()

@router.post("/", response_model=CheckinResponse, status_code=201)
def registrar_presenca(checkin_in: CheckinCreate, db: Session = Depends(get_db)):
    """
    Registra a entrada do aluno na academia, validando as seguintes regras:
    - O aluno possui plano ativo na data de hoje.
    - O aluno não possui pendências financeiras (mensalidades atrasadas).
    - O aluno ainda possui acessos semanais disponíveis de acordo com seu plano.
    """
    return checkin_service.create_checkin(db=db, checkin_in=checkin_in)

@router.get("/recent", response_model=List[CheckinResponse])
def get_recent_checkins(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    """Retorna os check-ins mais recentes ordenados por data decrescente."""
    return checkin_service.get_recent_checkins(db=db, limit=limit)

@router.get("/search-student")
def search_student_by_cpf(
    cpf: str = Query(..., description="CPF do aluno a buscar"),
    db: Session = Depends(get_db)
):
    """Busca um aluno pelo CPF para pré-preencher o formulário de check-in."""
    return checkin_service.find_student_by_cpf(db=db, cpf=cpf)
