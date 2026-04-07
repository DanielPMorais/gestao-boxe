from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import InvoiceResponse
from app.services import invoice_service

router = APIRouter()

@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """Lista todas as faturas ordenadas por vencimento."""
    return invoice_service.get_invoices(db, skip=skip, limit=limit)

@router.get("/summary")
def financial_summary(db: Session = Depends(get_db)):
    """Retorna totais financeiros do mês atual e quantidade de faturas em atraso."""
    return invoice_service.get_financial_summary(db)

@router.patch("/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Marca uma fatura como paga e registra a data de pagamento."""
    return invoice_service.mark_as_paid(db, invoice_id)

@router.post("/sync-late", status_code=200)
def sync_late(db: Session = Depends(get_db)):
    """Atualiza o status de faturas vencidas para LATE. Pode ser chamado periodicamente."""
    return invoice_service.sync_late_invoices(db)
