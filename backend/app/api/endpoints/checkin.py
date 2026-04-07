from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
