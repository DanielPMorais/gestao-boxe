import uuid
import random
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.domain import User, Student, Plan, Enrollment, Invoice, Checkin, RoleEnum, TechnicalLevelEnum, InvoiceStatusEnum

# Base64 fake placeholders for signatures
FAKE_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAc6IPWAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgKDAAWAhB5VAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUO9u2qsAAADLSURBVHja7d0xDsIwDETR7004AjfAsXACTsAVOAA34AjcAA9AaCgSIdIUKR8ptlP6W9pEsmR7lVREpAsAAAAAAAAAAAAAAACAn3HveD6eD/uOq6p9n9p33Dtm1fO5e8+X9XoYAwAAAAAAAAAAAAAAAB6Yp7P9c9Wxz0vHvszTPV6vD/uOq+p+n9p3987jPZp9X+7e83OdzvbPU9Wxz0vHvszTPATAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBf9AAbRReD2F4ZkQAAAABJRU5ErkJggg=="

def seed_db():
    db: Session = SessionLocal()
    
    print("Re-inicializando banco de dados para apresentação...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Planos Premium
    print("Criando planos...")
    plans_data = [
        {"name": "Bronze (Iniciante)", "price": 100.00, "duration_days": 30, "access_limit_per_week": 2},
        {"name": "Prata (Intermediário)", "price": 150.00, "duration_days": 30, "access_limit_per_week": 3},
        {"name": "Ouro (Focado)", "price": 200.00, "duration_days": 30, "access_limit_per_week": 5},
        {"name": "Black VIP (Elite)", "price": 350.00, "duration_days": 365, "access_limit_per_week": 7},
    ]
    plans = {}
    for p_data in plans_data:
        p = Plan(**p_data)
        db.add(p)
        db.flush()
        plans[p_data["name"]] = p

    # 2. Usuários e Alunos
    print("Populando alunos e cenários...")
    
    scenarios = [
        {
            "name": "Anderson 'Spider' Silva", 
            "cpf": "123.456.789-01", 
            "status": "Ativo", 
            "level": TechnicalLevelEnum.ATHLETE, 
            "plan": "Black VIP (Elite)",
            "signed": True,
            "scenario": "active_paid"
        },
        {
            "name": "Mike Tyson", 
            "cpf": "222.333.444-55", 
            "status": "Ativo", 
            "level": TechnicalLevelEnum.ATHLETE, 
            "plan": "Ouro (Focado)",
            "signed": True,
            "scenario": "late_invoice"
        },
        {
            "name": "Juliana 'Ju Thai' Lima", 
            "cpf": "999.888.777-66", 
            "status": "Ativo", 
            "level": TechnicalLevelEnum.AMATEUR, 
            "plan": "Prata (Intermediário)",
            "signed": False,
            "scenario": "unsigned"
        },
        {
            "name": "Charles do Bronx", 
            "cpf": "555.666.777-88", 
            "status": "Ativo", 
            "level": TechnicalLevelEnum.ATHLETE, 
            "plan": "Ouro (Focado)",
            "signed": True,
            "scenario": "scheduled_downgrade" # Está no Ouro mas agendou Bronze
        },
        {
            "name": "José Aldo", 
            "cpf": "111.999.333-22", 
            "status": "Inativo", 
            "level": TechnicalLevelEnum.AMATEUR, 
            "plan": "Bronze (Iniciante)",
            "signed": True,
            "scenario": "inactive"
        },
        {
            "name": "Novato da Silva", 
            "cpf": "000.111.222-33", 
            "status": "Ativo", 
            "level": TechnicalLevelEnum.BEGINNER, 
            "plan": None,
            "signed": False,
            "scenario": "no_plan"
        }
    ]

    for sc in scenarios:
        # User
        user = User(
            full_name=sc["name"],
            cpf=sc["cpf"],
            email=f"{sc['name'].split()[0].lower()}@gestaoboxe.com",
            role=RoleEnum.STUDENT,
            is_active=(sc["status"] == "Ativo")
        )
        db.add(user)
        db.flush()

        # Student
        student = Student(
            user_id=user.id,
            phone="(11) 9" + str(random.randint(70000000, 99999999)),
            technical_level=sc["level"],
            birth_date=date(1990, 5, 10),
            contract_signed=sc["signed"],
            signature_base64=FAKE_SIGNATURE if sc["signed"] else None,
            signature_date=datetime.now() - timedelta(days=20) if sc["signed"] else None
        )
        db.add(student)
        db.flush()

        # Matrículas
        if sc["plan"]:
            plan = plans[sc["plan"]]
            
            # Matrícula Atual
            enroll = Enrollment(
                student_id=student.id,
                plan_id=plan.id,
                start_date=date.today() - timedelta(days=15),
                end_date=date.today() + timedelta(days=15),
                is_active=True,
                contract_signed=True if sc["signed"] else False,
                signature_base64=FAKE_SIGNATURE if sc["signed"] else None,
                signature_date=datetime.now() - timedelta(days=15) if sc["signed"] else None
            )
            db.add(enroll)
            db.flush()

            # Faturas
            if sc["scenario"] == "late_invoice":
                db.add(Invoice(enrollment_id=enroll.id, amount=plan.price, due_date=date.today() - timedelta(days=5), status=InvoiceStatusEnum.LATE))
            elif sc["scenario"] == "active_paid":
                db.add(Invoice(enrollment_id=enroll.id, amount=plan.price, due_date=date.today() - timedelta(days=10), payment_date=date.today() - timedelta(days=10), status=InvoiceStatusEnum.PAID))
            else:
                db.add(Invoice(enrollment_id=enroll.id, amount=plan.price, due_date=date.today() + timedelta(days=10), status=InvoiceStatusEnum.PENDING))

            # Caso Especial: Downgrade Agendado
            if sc["scenario"] == "scheduled_downgrade":
                bronze = plans["Bronze (Iniciante)"]
                future_start = enroll.end_date + timedelta(days=1)
                future_enroll = Enrollment(
                    student_id=student.id,
                    plan_id=bronze.id,
                    start_date=future_start,
                    end_date=future_start + timedelta(days=30),
                    is_active=True,
                    contract_signed=True,
                    signature_base64=FAKE_SIGNATURE,
                    signature_date=datetime.now()
                )
                db.add(future_enroll)
                db.flush()
                # Fatura futura
                db.add(Invoice(enrollment_id=future_enroll.id, amount=bronze.price, due_date=future_start, status=InvoiceStatusEnum.PENDING))

        # Check-ins (Histórico)
        for d in range(10):
            if random.random() > 0.4: # 60% chance of checkin for history
                checkin_time = datetime.now() - timedelta(days=d, hours=random.randint(1, 8))
                db.add(Checkin(student_id=student.id, checkin_date=checkin_time))

    db.commit()
    print("\n--- SEED FINALIZADO COM SUCESSO ---")
    print(f"Alunos: {len(scenarios)}")
    print("Status Simulados: Ativos, Inativos, Atrasados, Downgrades Agendados, Sem Plano.")
    print("Assinaturas: Mockadas com placeholder de imagem.")
    db.close()

if __name__ == "__main__":
    seed_db()
