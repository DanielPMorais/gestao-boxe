from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from app.core.database import get_db
from app.models.domain import Enrollment, Checkin, Invoice, InvoiceStatusEnum

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    current_month = now.month
    current_year = now.year

    # 1. Alunos Ativos (matriculas ativas correntes)
    active_students = db.query(Enrollment).filter(
        Enrollment.is_active == True,
        Enrollment.start_date <= now.date(),
        Enrollment.end_date >= now.date()
    ).count()

    # 2. Check-ins Hoje
    today_checkins = db.query(Checkin).filter(
        Checkin.checkin_date >= today_start,
        Checkin.checkin_date <= today_end
    ).count()

    # 3. Receita Prevista do Mês
    # Usando extract para Mês e Ano seria mais seguro, mas simplificaremos via python filter ou extract do BD
    from sqlalchemy import extract
    revenue_query = db.query(func.sum(Invoice.amount)).filter(
        extract('month', Invoice.due_date) == current_month,
        extract('year', Invoice.due_date) == current_year
    ).scalar()
    
    expected_revenue = float(revenue_query) if revenue_query else 0.0

    # 4. Faturas Atrasadas
    late_invoices = db.query(Invoice).filter(
        Invoice.status == InvoiceStatusEnum.LATE
    ).count()

    return {
        "active_students": active_students,
        "today_checkins": today_checkins,
        "expected_revenue": expected_revenue,
        "late_invoices": late_invoices
    }
