"""
seed.py — Seed the database with 10,000 employees.

Performance notes:
- Uses SQLAlchemy Core bulk insert (not ORM) for maximum throughput.
- A single transaction wraps all inserts — one fsync instead of 10,000.
- Emails are made unique via a counter suffix to avoid constraint errors on re-runs.
- Runs in < 5 seconds on a modern laptop.

Usage:
    python seed.py                  # seed from backend/ directory
    python seed.py --count 500      # seed a different number
    python seed.py --clear          # wipe existing data first
"""

import argparse
import os
import random
import time
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import text

# ── Bootstrap path so we can import app modules ──────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, Base
from app.models import Employee  # ensures table is registered

# ── Constants ─────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent

JOB_TITLES = [
    "Software Engineer", "Senior Software Engineer", "Staff Engineer",
    "Engineering Manager", "Product Manager", "Data Analyst", "Data Scientist",
    "HR Specialist", "HR Manager", "Recruiter", "Finance Analyst", "Accountant",
    "Marketing Manager", "Sales Representative", "Sales Manager",
    "UX Designer", "UI Designer", "DevOps Engineer", "QA Engineer",
    "Legal Counsel", "Operations Manager", "Customer Success Manager",
]

DEPARTMENTS = [
    "Engineering", "Product", "Data", "HR", "Finance",
    "Marketing", "Sales", "Design", "Operations", "Legal", "Customer Success",
]

COUNTRIES = [
    "United States", "United Kingdom", "India", "Germany", "Canada",
    "Australia", "Singapore", "France", "Netherlands", "Brazil",
]

CURRENCIES_BY_COUNTRY = {
    "United States": "USD",
    "United Kingdom": "GBP",
    "India": "INR",
    "Germany": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Singapore": "SGD",
    "France": "EUR",
    "Netherlands": "EUR",
    "Brazil": "BRL",
}

SALARY_RANGES_BY_TITLE = {
    "Software Engineer": (70_000, 130_000),
    "Senior Software Engineer": (110_000, 180_000),
    "Staff Engineer": (150_000, 220_000),
    "Engineering Manager": (140_000, 210_000),
    "Product Manager": (100_000, 170_000),
    "Data Analyst": (60_000, 110_000),
    "Data Scientist": (90_000, 160_000),
    "HR Specialist": (50_000, 80_000),
    "HR Manager": (80_000, 130_000),
    "Recruiter": (55_000, 90_000),
    "Finance Analyst": (65_000, 110_000),
    "Accountant": (55_000, 90_000),
    "Marketing Manager": (80_000, 140_000),
    "Sales Representative": (45_000, 90_000),
    "Sales Manager": (90_000, 160_000),
    "UX Designer": (70_000, 120_000),
    "UI Designer": (65_000, 115_000),
    "DevOps Engineer": (90_000, 155_000),
    "QA Engineer": (65_000, 110_000),
    "Legal Counsel": (100_000, 180_000),
    "Operations Manager": (75_000, 130_000),
    "Customer Success Manager": (65_000, 110_000),
}

EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern"]
EMPLOYMENT_TYPE_WEIGHTS = [0.80, 0.08, 0.10, 0.02]


def load_names(filename: str) -> list[str]:
    path = SCRIPT_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing {filename} — place it in {SCRIPT_DIR}")
    return [line.strip() for line in path.read_text().splitlines() if line.strip()]


def random_date(start_year: int = 2015, end_year: int = 2024) -> date:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))


def build_rows(first_names: list[str], last_names: list[str], count: int) -> list[dict]:
    rows = []
    for i in range(count):
        first = random.choice(first_names)
        last = random.choice(last_names)
        full_name = f"{first} {last}"

        job_title = random.choice(JOB_TITLES)
        country = random.choice(COUNTRIES)
        low, high = SALARY_RANGES_BY_TITLE[job_title]
        salary = round(random.uniform(low, high), 2)
        emp_type = random.choices(EMPLOYMENT_TYPES, weights=EMPLOYMENT_TYPE_WEIGHTS)[0]

        # unique email: firstname.lastname+i@company.com
        email = f"{first.lower()}.{last.lower()}{i}@company.com"

        rows.append(
            {
                "full_name": full_name,
                "email": email,
                "job_title": job_title,
                "department": random.choice(DEPARTMENTS),
                "country": country,
                "salary": salary,
                "currency": CURRENCIES_BY_COUNTRY[country],
                "employment_type": emp_type,
                "date_joined": random_date(),
            }
        )
    return rows


def seed(count: int = 10_000, clear: bool = False):
    print(f"Loading name lists…")
    first_names = load_names("first_names.txt")
    last_names = load_names("last_names.txt")
    print(f"  {len(first_names)} first names × {len(last_names)} last names loaded")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        if clear:
            print("Clearing existing employee data…")
            conn.execute(text("DELETE FROM employees"))

        print(f"Building {count:,} employee records…")
        t0 = time.perf_counter()
        rows = build_rows(first_names, last_names, count)

        print("Inserting into database (bulk)…")
        # Core bulk insert — much faster than ORM session.add() in a loop
        conn.execute(Employee.__table__.insert(), rows)

        elapsed = time.perf_counter() - t0
        print(f"✓ Seeded {count:,} employees in {elapsed:.2f}s")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed salary_tool.db with employees")
    parser.add_argument("--count", type=int, default=10_000, help="Number of employees to insert")
    parser.add_argument("--clear", action="store_true", help="Delete existing employees first")
    args = parser.parse_args()
    seed(count=args.count, clear=args.clear)
