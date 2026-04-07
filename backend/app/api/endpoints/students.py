from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import StudentResponse, StudentRegistrationCreate, StudentUpdate
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

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_in: StudentUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de um aluno existente (nome, email, telefone, nível, etc.)."""
    return student_service.update_student(db=db, student_id=student_id, student_in=student_in)

@router.delete("/{student_id}", status_code=200)
def disable_student(student_id: str, db: Session = Depends(get_db)):
    """Aplica o Soft-Delete (Desativa) em um aluno e seu respectivo usuário global."""
    return student_service.soft_delete_student(db=db, student_id=student_id)

@router.patch("/{student_id}/toggle-status", status_code=200)
def toggle_status(student_id: str, db: Session = Depends(get_db)):
    """Faz a troca do status Ativo/Inativo do aluno."""
    return student_service.toggle_student_status(db=db, student_id=student_id)

