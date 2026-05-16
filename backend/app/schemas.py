from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


EmploymentType = Literal["Full-Time", "Part-Time", "Contract", "Intern"]


class EmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    job_title: str = Field(..., min_length=2, max_length=150)
    department: str = Field(..., min_length=2, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    salary: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=10)
    employment_type: EmploymentType = "Full-Time"
    date_joined: date


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    job_title: Optional[str] = Field(None, min_length=2, max_length=150)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    salary: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    employment_type: Optional[EmploymentType] = None
    date_joined: Optional[date] = None


class EmployeeRead(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Pagination ──────────────────────────────────────────────────────────────

class PaginatedEmployees(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[EmployeeRead]


# ── Insights ─────────────────────────────────────────────────────────────────

class CountrySalaryInsight(BaseModel):
    country: str
    min_salary: float
    max_salary: float
    avg_salary: float
    employee_count: int


class JobTitleInsight(BaseModel):
    job_title: str
    country: str
    avg_salary: float
    employee_count: int


class DepartmentInsight(BaseModel):
    department: str
    avg_salary: float
    min_salary: float
    max_salary: float
    employee_count: int


class SalaryBand(BaseModel):
    band: str
    count: int


class DashboardSummary(BaseModel):
    total_employees: int
    avg_salary: float
    highest_paid_country: str
    top_department_by_headcount: str
    salary_bands: list[SalaryBand]
