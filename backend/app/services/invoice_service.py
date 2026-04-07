from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from fastapi import HTTPException
from datetime import date, datetime
from app.models.domain import Invoice, InvoiceStatusEnum, Enrollment

def get_invoices(db: Session, skip: int = 0, limit: int = 200):
    return (
        db.query(Invoice)
        .order_by(Invoice.due_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def mark_as_paid(db: Session, invoice_id: str):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura não encontrada.")
    if invoice.status == InvoiceStatusEnum.PAID:
        raise HTTPException(status_code=400, detail="Esta fatura já foi paga.")
    invoice.status = InvoiceStatusEnum.PAID
    invoice.payment_date = date.today()
    db.commit()
    db.refresh(invoice)
    return invoice

def sync_late_invoices(db: Session):
    """Marca como LATE todas as faturas PENDING com vencimento anterior a hoje."""
    today = date.today()
    updated = (
        db.query(Invoice)
        .filter(
            Invoice.status == InvoiceStatusEnum.PENDING,
            Invoice.due_date < today
        )
        .all()
    )
    for inv in updated:
        inv.status = InvoiceStatusEnum.LATE
    db.commit()
    return {"updated": len(updated)}

def get_financial_summary(db: Session):
    today = date.today()
    current_month = today.month
    current_year = today.year

    def month_sum(status: InvoiceStatusEnum):
        result = db.query(func.sum(Invoice.amount)).filter(
            Invoice.status == status,
            extract('month', Invoice.due_date) == current_month,
            extract('year', Invoice.due_date) == current_year,
        ).scalar()
        return float(result) if result else 0.0

    total_paid = month_sum(InvoiceStatusEnum.PAID)
    total_pending = month_sum(InvoiceStatusEnum.PENDING)
    total_late = db.query(func.sum(Invoice.amount)).filter(
        Invoice.status == InvoiceStatusEnum.LATE
    ).scalar()
    total_late = float(total_late) if total_late else 0.0

    count_late = db.query(Invoice).filter(Invoice.status == InvoiceStatusEnum.LATE).count()

    return {
        "total_paid_month": total_paid,
        "total_pending_month": total_pending,
        "total_late_all": total_late,
        "count_late": count_late,
    }
