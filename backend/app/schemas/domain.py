from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional, List
from datetime import date, datetime
from app.models.domain import RoleEnum, TechnicalLevelEnum, CertStatusEnum, InvoiceStatusEnum

# ----------- USERS -----------
class UserBase(BaseModel):
    full_name: str
    cpf: str
    email: EmailStr
    role: RoleEnum

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID4

    class Config:
        from_attributes = True

# ----------- STUDENTS -----------
class StudentBase(BaseModel):
    phone: Optional[str] = None
    technical_level: TechnicalLevelEnum = TechnicalLevelEnum.BEGINNER
    medical_cert_status: CertStatusEnum = CertStatusEnum.PENDING

class StudentCreate(StudentBase):
    user_id: UUID4

class StudentResponse(StudentBase):
    id: UUID4
    user: UserResponse

    class Config:
        from_attributes = True

# ----------- PLANS -----------
class PlanBase(BaseModel):
    name: str
    price: float
    duration_days: int
    access_limit_per_week: int

class PlanCreate(PlanBase):
    pass

class PlanResponse(PlanBase):
    id: UUID4

    class Config:
        from_attributes = True

# ----------- ENROLLMENTS -----------
class EnrollmentBase(BaseModel):
    student_id: UUID4
    plan_id: UUID4
    start_date: date
    end_date: date
    is_active: bool = True

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentResponse(EnrollmentBase):
    id: UUID4

    class Config:
        from_attributes = True

# ----------- INVOICES -----------
class InvoiceBase(BaseModel):
    enrollment_id: UUID4
    amount: float
    due_date: date
    payment_date: Optional[date] = None
    status: InvoiceStatusEnum = InvoiceStatusEnum.PENDING

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: UUID4

    class Config:
        from_attributes = True

# ----------- CHECKINS -----------
class CheckinBase(BaseModel):
    student_id: UUID4

class CheckinCreate(CheckinBase):
    pass

class CheckinResponse(CheckinBase):
    id: UUID4
    checkin_date: datetime

    class Config:
        from_attributes = True
