from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import StudentResponse, StudentRegistrationCreate
from app.services import student_service

router = APIRouter()

@router.get("/", response_model=List[StudentResponse])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os alunos obtendo metadados de Usuário através de joins invisíveis do ORM."""
    return student_service.get_students(db, skip=skip, limit=limit)

@router.post("/", response_model=StudentResponse, status_code=201)
def register_student(student_in: StudentRegistrationCreate, db: Session = Depends(get_db)):
    """Cadastra um Aluno unificando dados de Usuário em uma transação limpa."""
    return student_service.create_student(db=db, student_in=student_in)
