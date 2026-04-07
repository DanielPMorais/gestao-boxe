import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Numeric, DateTime, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"

class TechnicalLevelEnum(str, enum.Enum):
    BEGINNER = "BEGINNER"
    AMATEUR = "AMATEUR"
    ATHLETE = "ATHLETE"

class CertStatusEnum(str, enum.Enum):
    VALID = "VALID"
    PENDING = "PENDING"
    EXPIRED = "EXPIRED"

class InvoiceStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    LATE = "LATE"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    phone = Column(String)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    technical_level = Column(Enum(TechnicalLevelEnum), default=TechnicalLevelEnum.BEGINNER)
    medical_cert_status = Column(Enum(CertStatusEnum), default=CertStatusEnum.PENDING)

    user = relationship("User", back_populates="student_profile")
    enrollments = relationship("Enrollment", back_populates="student")
    checkins = relationship("Checkin", back_populates="student")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    specialty = Column(String)

    user = relationship("User", back_populates="teacher_profile")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    duration_days = Column(Integer, nullable=False)
    access_limit_per_week = Column(Integer, nullable=False)

    enrollments = relationship("Enrollment", back_populates="plan")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    student = relationship("Student", back_populates="enrollments")
    plan = relationship("Plan", back_populates="enrollments")
    invoices = relationship("Invoice", back_populates="enrollment")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    status = Column(Enum(InvoiceStatusEnum), default=InvoiceStatusEnum.PENDING)

    enrollment = relationship("Enrollment", back_populates="invoices")

class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    checkin_date = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="checkins")
