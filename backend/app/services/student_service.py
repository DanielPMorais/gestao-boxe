from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import User, Student, RoleEnum
from app.schemas.domain import StudentRegistrationCreate, StudentUpdate

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
        birth_date=student_in.birth_date,
        gender=student_in.gender,
        technical_level=student_in.technical_level
    )
    db.add(new_student)
    
    # 3. Finaliza a transação
    db.commit()
    db.refresh(new_student)
    
    return new_student

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Student).offset(skip).limit(limit).all()

def update_student(db: Session, student_id: str, student_in: StudentUpdate):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado na base de dados.")
    
    # Atualiza campos do User (nome, email)
    if student_in.full_name is not None:
        student.user.full_name = student_in.full_name
    if student_in.email is not None:
        # Verifica se o email já está em uso por outro usuário
        existing = db.query(User).filter(User.email == student_in.email, User.id != student.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado para outro usuário.")
        student.user.email = student_in.email
    
    # Atualiza campos do Student
    if student_in.phone is not None:
        student.phone = student_in.phone
    if student_in.birth_date is not None:
        student.birth_date = student_in.birth_date
    if student_in.gender is not None:
        student.gender = student_in.gender
    if student_in.technical_level is not None:
        student.technical_level = student_in.technical_level
    
    db.commit()
    db.refresh(student)
    return student

def soft_delete_student(db: Session, student_id: str):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado na base de dados.")
    
    student.user.is_active = False
    db.commit()
    return {"detail": "Aluno desativado com sucesso."}

