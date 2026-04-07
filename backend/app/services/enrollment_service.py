from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date, timedelta, datetime
from app.models.domain import Enrollment, Student, Plan, Invoice, InvoiceStatusEnum
from app.schemas.domain import EnrollmentCreate

def create_enrollment(db: Session, enroll_in: EnrollmentCreate):
    # Validar se aluno existe
    student = db.query(Student).filter(Student.id == enroll_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    # Validar se plano existe
    plan = db.query(Plan).filter(Plan.id == enroll_in.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")

    # Verifica se aluno já possui matrícula ativa
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enroll_in.student_id,
        Enrollment.is_active == True,
        Enrollment.end_date >= date.today()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="O aluno já possui uma matrícula ativa.")

    # Calcular end_date com base na duração do plano
    start = enroll_in.start_date
    end = start + timedelta(days=plan.duration_days - 1)

    enrollment = Enrollment(
        student_id=enroll_in.student_id,
        plan_id=enroll_in.plan_id,
        start_date=start,
        end_date=end,
        is_active=True
    )
    db.add(enrollment)
    db.flush()

    # Gerar fatura automaticamente para o primeiro mês
    invoice = Invoice(
        enrollment_id=enrollment.id,
        amount=plan.price,
        due_date=start + timedelta(days=5),  # vence 5 dias após o início
        status=InvoiceStatusEnum.PENDING
    )
    db.add(invoice)
    db.commit()
    db.refresh(enrollment)
    return enrollment

def get_enrollments(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Enrollment)
        .order_by(Enrollment.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
