from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import Plan
from app.schemas.domain import PlanCreate

def create_plan(db: Session, plan_in: PlanCreate):
    existing = db.query(Plan).filter(Plan.name == plan_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um plano com este nome.")
    plan = Plan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

def get_plans(db: Session):
    return db.query(Plan).order_by(Plan.price).all()

def delete_plan(db: Session, plan_id: str):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    db.delete(plan)
    db.commit()
    return {"detail": "Plano removido com sucesso."}
