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
        is_active=True,
        contract_signed=True if enroll_in.signature_base64 else False,
        signature_date=datetime.utcnow() if enroll_in.signature_base64 else None,
        signature_base64=enroll_in.signature_base64
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

def calculate_upgrade_info(db: Session, enrollment_id: str, new_plan_id: str):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    new_plan = db.query(Plan).filter(Plan.id == new_plan_id).first()
    
    if not enrollment or not new_plan:
        return None
        
    today = date.today()
    current_price = float(enrollment.plan.price)
    new_price_nominal = float(new_plan.price)
    
    # Se o novo plano for mais barato ou igual (Downgrade ou Troca de mesma faixa)
    # A transição é agendada para o fim da vigência atual.
    if new_price_nominal <= current_price:
        return {
            "type": "downgrade",
            "current_plan_name": enrollment.plan.name,
            "new_plan_name": new_plan.name,
            "unused_credit": 0,
            "total_to_pay": 0,
            "remaining_days": (enrollment.end_date - today).days + 1,
            "next_start_date": enrollment.end_date + timedelta(days=1)
        }
    
    # Se for mais caro (Upgrade), a transição é imediata com crédito proporcional
    total_days = (enrollment.end_date - enrollment.start_date).days + 1
    remaining_days = (enrollment.end_date - today).days + 1
    
    if remaining_days < 0: remaining_days = 0
    if remaining_days > total_days: remaining_days = total_days
    
    # Preço diário do plano atual
    daily_rate = current_price / total_days
    unused_credit = daily_rate * remaining_days
    
    final_upgrade_price = new_price_nominal - unused_credit
    if final_upgrade_price < 0: final_upgrade_price = 0
    
    return {
        "type": "upgrade",
        "current_plan_name": enrollment.plan.name,
        "new_plan_name": new_plan.name,
        "unused_credit": round(unused_credit, 2),
        "total_to_pay": round(final_upgrade_price, 2),
        "remaining_days": remaining_days,
        "next_start_date": today
    }

def upgrade_enrollment(db: Session, enrollment_id: str, new_plan_id: str, signature_base64: str = None):
    info = calculate_upgrade_info(db, enrollment_id, new_plan_id)
    if not info:
        raise HTTPException(status_code=404, detail="Matrícula ou Plano não encontrados.")
        
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    new_plan = db.query(Plan).filter(Plan.id == new_plan_id).first()
    
    # ── Lógica de Upgrade (Imediato) ──
    if info["type"] == "upgrade":
        enrollment.is_active = False
        start = date.today()
        end = start + timedelta(days=new_plan.duration_days - 1)
        
        new_enrollment = Enrollment(
            student_id=enrollment.student_id,
            plan_id=new_plan.id,
            start_date=start,
            end_date=end,
            is_active=True,
            contract_signed=True if signature_base64 else False,
            signature_date=datetime.utcnow() if signature_base64 else None,
            signature_base64=signature_base64
        )
        db.add(new_enrollment)
        db.flush()
        
        invoice = Invoice(
            enrollment_id=new_enrollment.id,
            amount=info["total_to_pay"],
            due_date=start + timedelta(days=5),
            status=InvoiceStatusEnum.PENDING
        )
        db.add(invoice)
        db.commit()
        db.refresh(new_enrollment)
        return new_enrollment

    # ── Lógica de Downgrade (Agendado) ──
    else:
        # A matrícula atual permanece ativa até o fim
        start = info["next_start_date"]
        end = start + timedelta(days=new_plan.duration_days - 1)
        
        # Criamos a nova matrícula já agendada (is_active=True, mas start_date no futuro)
        new_enrollment = Enrollment(
            student_id=enrollment.student_id,
            plan_id=new_plan.id,
            start_date=start,
            end_date=end,
            is_active=True, # Ela é válida, mas só "vence" a atual quando a data chegar
            contract_signed=True if signature_base64 else False,
            signature_date=datetime.utcnow() if signature_base64 else None,
            signature_base64=signature_base64
        )
        db.add(new_enrollment)
        db.flush()
        
        # Fatura para o dia em que o novo plano começa
        invoice = Invoice(
            enrollment_id=new_enrollment.id,
            amount=new_plan.price,
            due_date=start,
            status=InvoiceStatusEnum.PENDING
        )
        db.add(invoice)
        db.commit()
        db.refresh(new_enrollment)
        return new_enrollment
