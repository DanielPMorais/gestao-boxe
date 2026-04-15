from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException

from app.models.domain import Checkin, Enrollment, Invoice, Plan, InvoiceStatusEnum, Student, User
from app.schemas.domain import CheckinCreate

def get_week_range(date_obj: datetime):
    # Segunda-feira da semana atual
    start = date_obj - timedelta(days=date_obj.weekday())
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    # Domingo da semana atual
    end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return start, end

def create_checkin(db: Session, checkin_in: CheckinCreate) -> Checkin:
    now = datetime.now()

    # [NOVO] 0. Bloqueio Anti-Spam / Cooldown de Check-in
    recent_checkin = db.query(Checkin).filter(
        Checkin.student_id == checkin_in.student_id,
        Checkin.checkin_date >= now - timedelta(hours=4)
    ).first()
    
    if recent_checkin:
        raise HTTPException(
            status_code=400, 
            detail="Este aluno já realizou check-in recentemente. Aguarde algumas horas."
        )
    
    # 1. Encontrar matrícula ativa e válida do aluno
    active_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == checkin_in.student_id,
        Enrollment.is_active == True,
        Enrollment.start_date <= now.date(),
        Enrollment.end_date >= now.date()
    ).first()
    
    if not active_enrollment:
        raise HTTPException(status_code=400, detail="Aluno não possui plano ativo e válido neste momento.")
        
    # 2. Verificar Invoices atrasadas associadas à matrícula
    late_invoices = db.query(Invoice).filter(
        Invoice.enrollment_id == active_enrollment.id,
        Invoice.status == InvoiceStatusEnum.LATE
    ).count()
    
    if late_invoices > 0:
        raise HTTPException(status_code=400, detail="Bloqueio Financeiro: O aluno possui mensalidades em atraso.")
        
    # 3. Validar limite semanal de aulas
    plan = db.query(Plan).filter(Plan.id == active_enrollment.plan_id).first()
    
    start_week, end_week = get_week_range(now)
    checkins_this_week = db.query(Checkin).filter(
        Checkin.student_id == checkin_in.student_id,
        Checkin.checkin_date >= start_week,
        Checkin.checkin_date <= end_week
    ).count()
    
    if checkins_this_week >= plan.access_limit_per_week:
        raise HTTPException(
            status_code=400, 
            detail=f"Limite de aulas semanais atingido ({plan.access_limit_per_week} aulas disponíveis por semana)."
        )
        
    # Efetuando o check-in no banco
    new_checkin = Checkin(student_id=checkin_in.student_id, checkin_date=now)
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)
    
    return new_checkin

def get_recent_checkins(db: Session, limit: int = 50):
    """Retorna os check-ins mais recentes com join nos dados do aluno."""
    return (
        db.query(Checkin)
        .order_by(desc(Checkin.checkin_date))
        .limit(limit)
        .all()
    )

def find_student(db: Session, query: str):
    """Busca aluno por CPF exato ou LIKE no nome e retorna dados resumidos para sugestão de check-in."""
    sanitized_query = query.replace(".", "").replace("-", "")
    
    user = db.query(User).filter(
        User.is_active == True,
        (User.cpf == sanitized_query) | (User.full_name.ilike(f"%{query}%"))
    ).first()
    
    if not user or not user.student_profile:
        raise HTTPException(status_code=404, detail="Nenhum aluno ativo encontrado com essa busca.")
        
    student = user.student_profile
    return {
        "student_id": str(student.id),
        "full_name": user.full_name,
        "cpf": user.cpf,
        "technical_level": student.technical_level.value if student.technical_level else None,
    }
