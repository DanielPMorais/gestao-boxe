from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import User, Student, RoleEnum
from app.schemas.domain import StudentRegistrationCreate

def create_student(db: Session, student_in: StudentRegistrationCreate):
    # Validar se CPF ou email já existem
    existing_user = db.query(User).filter(
        (User.cpf == student_in.cpf) | (User.email == student_in.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="O CPF ou E-mail já estão cadastrados na plataforma.")

    # 1. Criação do User associado
    new_user = User(
        full_name=student_in.full_name,
        cpf=student_in.cpf,
        email=student_in.email,
        role=RoleEnum.STUDENT
    )
    db.add(new_user)
    db.flush() # Flush garante que possuímos o ID do usuario mas não commita publicamente ainda
    
    # 2. Criação do Perfil Student vinculado ao User
    new_student = Student(
        user_id=new_user.id,
        phone=student_in.phone,
        technical_level=student_in.technical_level
    )
    db.add(new_student)
    
    # 3. Finaliza a transação
    db.commit()
    db.refresh(new_student)
    
    return new_student

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Student).offset(skip).limit(limit).all()
