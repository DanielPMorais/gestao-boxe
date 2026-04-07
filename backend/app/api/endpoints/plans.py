from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.domain import PlanCreate, PlanResponse
from app.services import plan_service

router = APIRouter()

@router.get("/", response_model=List[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return plan_service.get_plans(db)

@router.post("/", response_model=PlanResponse, status_code=201)
def create_plan(plan_in: PlanCreate, db: Session = Depends(get_db)):
    return plan_service.create_plan(db, plan_in)

@router.delete("/{plan_id}", status_code=200)
def delete_plan(plan_id: str, db: Session = Depends(get_db)):
    return plan_service.delete_plan(db, plan_id)
