import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.domain import User, Student, Plan, Enrollment, Invoice, Checkin, RoleEnum, TechnicalLevelEnum, CertStatusEnum, InvoiceStatusEnum

def seed_db():
    db: Session = SessionLocal()
    
    # 1. Limpar dados existentes (Opcional, mas util para seed limpo)
    print("Limpando banco de dados...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("Iniciando Seed...")

    # 2. Criar Planos
    plans_data = [
        {"name": "Bronze (2x/Semana)", "price": 120.00, "duration_days": 30, "access_limit_per_week": 2},
        {"name": "Prata (3x/Semana)", "price": 160.00, "duration_days": 30, "access_limit_per_week": 3},
        {"name": "Ouro (Livre)", "price": 250.00, "duration_days": 30, "access_limit_per_week": 7},
    ]
    plans = []
    for p in plans_data:
        plan = Plan(**p)
        db.add(plan)
        plans.append(plan)
    db.flush()

    # 3. Criar Alunos
    students_data = [
        {"full_name": "Anderson Silva", "cpf": "111.111.111-11", "email": "spider@ufc.com", "phone": "(11) 98888-8888", "tech": TechnicalLevelEnum.ATHLETE},
        {"full_name": "Mike Tyson", "cpf": "222.222.222-22", "email": "mike@iron.com", "phone": "(11) 97777-7777", "tech": TechnicalLevelEnum.ATHLETE},
        {"full_name": "Popó Freitas", "cpf": "333.333.333-33", "email": "popo@boxe.br", "phone": "(11) 96666-6666", "tech": TechnicalLevelEnum.AMATEUR},
        {"full_name": "Juliana Lima", "cpf": "444.444.444-44", "email": "ju@gmail.com", "phone": "(11) 95555-5555", "tech": TechnicalLevelEnum.BEGINNER},
        {"full_name": "Ricardo Arona", "cpf": "555.555.555-55", "email": "arona@jj.com", "phone": "(11) 94444-4444", "tech": TechnicalLevelEnum.BEGINNER},
    ]

    for i, s_data in enumerate(students_data):
        # User
        user = User(
            full_name=s_data["full_name"],
            cpf=s_data["cpf"],
            email=s_data["email"],
            role=RoleEnum.STUDENT,
            is_active=True
        )
        db.add(user)
        db.flush()

        # Student
        student = Student(
            user_id=user.id,
            phone=s_data["phone"],
            technical_level=s_data["tech"],
            medical_cert_status=CertStatusEnum.VALID if i % 2 == 0 else CertStatusEnum.PENDING,
            birth_date=date(1980 + i, 1, 1)
        )
        db.add(student)
        db.flush()

        # Matrícula (Enrollment) - Alternando planos
        plan = plans[i % len(plans)]
        start_date = date.today() - timedelta(days=10)
        end_date = start_date + timedelta(days=plan.duration_days)
        
        enrollment = Enrollment(
            student_id=student.id,
            plan_id=plan.id,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        db.add(enrollment)
        db.flush()

        # Invoices
        # 1. Paga (do mês passado ou desse)
        invoice_paid = Invoice(
            enrollment_id=enrollment.id,
            amount=plan.price,
            due_date=start_date + timedelta(days=5),
            payment_date=start_date + timedelta(days=2),
            status=InvoiceStatusEnum.PAID
        )
        db.add(invoice_paid)

        # 2. Pendente ou Atrasada (para alguns)
        if i == 1: # Tyson está atrasado
            invoice_late = Invoice(
                enrollment_id=enrollment.id,
                amount=plan.price,
                due_date=date.today() - timedelta(days=5),
                status=InvoiceStatusEnum.LATE
            )
            db.add(invoice_late)
        elif i == 3: # Juliana está pendente
            invoice_pending = Invoice(
                enrollment_id=enrollment.id,
                amount=plan.price,
                due_date=date.today() + timedelta(days=5),
                status=InvoiceStatusEnum.PENDING
            )
            db.add(invoice_pending)

        # Check-ins
        # Alguns check-ins para hoje
        if i % 2 == 0:
            checkin = Checkin(
                student_id=student.id,
                checkin_date=datetime.now()
            )
            db.add(checkin)

    db.commit()
    print("Seed finalizado com sucesso!")
    db.close()

if __name__ == "__main__":
    seed_db()
