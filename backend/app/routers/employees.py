from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, asc, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.schemas import (
    CountrySalaryInsight,
    DashboardSummary,
    DepartmentInsight,
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    JobTitleInsight,
    PaginatedEmployees,
    SalaryBand,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_or_404(db: Session, employee_id: int) -> Employee:
    emp = db.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


# ── CRUD ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedEmployees)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by name, title, or department"),
    country: Optional[str] = None,
    department: Optional[str] = None,
    job_title: Optional[str] = None,
    employment_type: Optional[str] = None,
    sort_by: str = Query("full_name", enum=["full_name", "salary", "date_joined", "country"]),
    sort_dir: str = Query("asc", enum=["asc", "desc"]),
    db: Session = Depends(get_db),
):
    q = db.query(Employee)

    if search:
        term = f"%{search}%"
        q = q.filter(
            Employee.full_name.ilike(term)
            | Employee.job_title.ilike(term)
            | Employee.department.ilike(term)
        )
    if country:
        q = q.filter(Employee.country == country)
    if department:
        q = q.filter(Employee.department == department)
    if job_title:
        q = q.filter(Employee.job_title == job_title)
    if employment_type:
        q = q.filter(Employee.employment_type == employment_type)

    total = q.count()

    sort_col = getattr(Employee, sort_by)
    q = q.order_by(asc(sort_col) if sort_dir == "asc" else desc(sort_col))
    results = q.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedEmployees(total=total, page=page, page_size=page_size, results=results)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, employee_id)


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = get_or_404(db, employee_id)
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != emp.email:
        if db.query(Employee).filter(Employee.email == data["email"]).first():
            raise HTTPException(status_code=409, detail="Email already in use")
    for key, value in data.items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = get_or_404(db, employee_id)
    db.delete(emp)
    db.commit()


# ── Insights ─────────────────────────────────────────────────────────────────

@router.get("/insights/by-country", response_model=list[CountrySalaryInsight], tags=["Insights"])
def salary_by_country(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Employee.country,
            func.min(Employee.salary).label("min_salary"),
            func.max(Employee.salary).label("max_salary"),
            func.avg(Employee.salary).label("avg_salary"),
            func.count(Employee.id).label("employee_count"),
        )
        .group_by(Employee.country)
        .order_by(desc("avg_salary"))
        .all()
    )
    return [
        CountrySalaryInsight(
            country=r.country,
            min_salary=round(r.min_salary, 2),
            max_salary=round(r.max_salary, 2),
            avg_salary=round(r.avg_salary, 2),
            employee_count=r.employee_count,
        )
        for r in rows
    ]


@router.get("/insights/by-job-title", response_model=list[JobTitleInsight], tags=["Insights"])
def salary_by_job_title(
    country: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        Employee.job_title,
        Employee.country,
        func.avg(Employee.salary).label("avg_salary"),
        func.count(Employee.id).label("employee_count"),
    )
    if country:
        q = q.filter(Employee.country == country)
    rows = q.group_by(Employee.job_title, Employee.country).order_by(desc("avg_salary")).all()
    return [
        JobTitleInsight(
            job_title=r.job_title,
            country=r.country,
            avg_salary=round(r.avg_salary, 2),
            employee_count=r.employee_count,
        )
        for r in rows
    ]


@router.get("/insights/by-department", response_model=list[DepartmentInsight], tags=["Insights"])
def salary_by_department(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Employee.department,
            func.avg(Employee.salary).label("avg_salary"),
            func.min(Employee.salary).label("min_salary"),
            func.max(Employee.salary).label("max_salary"),
            func.count(Employee.id).label("employee_count"),
        )
        .group_by(Employee.department)
        .order_by(desc("avg_salary"))
        .all()
    )
    return [
        DepartmentInsight(
            department=r.department,
            avg_salary=round(r.avg_salary, 2),
            min_salary=round(r.min_salary, 2),
            max_salary=round(r.max_salary, 2),
            employee_count=r.employee_count,
        )
        for r in rows
    ]


@router.get("/insights/dashboard", response_model=DashboardSummary, tags=["Insights"])
def dashboard_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Employee.id)).scalar()
    avg_sal = db.query(func.avg(Employee.salary)).scalar() or 0

    top_country = (
        db.query(Employee.country, func.avg(Employee.salary).label("avg_sal"))
        .group_by(Employee.country)
        .order_by(desc("avg_sal"))
        .first()
    )

    top_dept = (
        db.query(Employee.department, func.count(Employee.id).label("cnt"))
        .group_by(Employee.department)
        .order_by(desc("cnt"))
        .first()
    )

    # Salary bands
    bands = [
        ("< $30k", 0, 30_000),
        ("$30k–$60k", 30_000, 60_000),
        ("$60k–$100k", 60_000, 100_000),
        ("$100k–$150k", 100_000, 150_000),
        ("> $150k", 150_000, 9_999_999),
    ]
    salary_bands = []
    for label, low, high in bands:
        count = (
            db.query(func.count(Employee.id))
            .filter(Employee.salary >= low, Employee.salary < high)
            .scalar()
        )
        salary_bands.append(SalaryBand(band=label, count=count))

    return DashboardSummary(
        total_employees=total,
        avg_salary=round(avg_sal, 2),
        highest_paid_country=top_country.country if top_country else "N/A",
        top_department_by_headcount=top_dept.department if top_dept else "N/A",
        salary_bands=salary_bands,
    )


# ── Filter Enumerations (for dropdowns) ──────────────────────────────────────

@router.get("/meta/countries", response_model=list[str], tags=["Meta"])
def list_countries(db: Session = Depends(get_db)):
    rows = db.query(Employee.country).distinct().order_by(Employee.country).all()
    return [r.country for r in rows]


@router.get("/meta/departments", response_model=list[str], tags=["Meta"])
def list_departments(db: Session = Depends(get_db)):
    rows = db.query(Employee.department).distinct().order_by(Employee.department).all()
    return [r.department for r in rows]


@router.get("/meta/job-titles", response_model=list[str], tags=["Meta"])
def list_job_titles(db: Session = Depends(get_db)):
    rows = db.query(Employee.job_title).distinct().order_by(Employee.job_title).all()
    return [r.job_title for r in rows]
