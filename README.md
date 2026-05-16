# Salary Management Tool

A full-stack HR salary management tool for organizations with 10,000+ employees.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13 + FastAPI |
| Database | SQLite via SQLAlchemy 2.0 (ORM + Core) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Data Fetching | TanStack React Query |
| Testing | pytest + httpx |

---

## Project Structure

```
salary-tool/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine + session factory
│   │   ├── models.py        # Employee ORM model
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       └── employees.py # All CRUD + insight endpoints
│   ├── tests/
│   │   ├── conftest.py      # In-memory DB fixtures
│   │   ├── test_employees.py
│   │   └── test_insights.py
│   ├── seed.py              # Bulk seeder (10k employees)
│   ├── first_names.txt
│   ├── last_names.txt
│   ├── pytest.ini
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── lib/
        │   ├── api.js       # Axios API client
        │   └── utils.js     # Formatting helpers
        ├── pages/
        │   ├── EmployeesPage.jsx
        │   └── InsightsPage.jsx
        └── components/
            ├── EmployeeModal.jsx
            └── DeleteModal.jsx
```

---

## Getting Started

### Backend

```bash
cd backend
py -3.13 -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Seed the database:
```bash
python seed.py --clear         # wipes existing data and seeds 10,000 employees
python seed.py --count 500     # seed a custom count
```

Start the API:
```bash
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Tests

```bash
cd backend
venv\Scripts\activate
python -m pytest
```

---

## API Endpoints

### Employees (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | List with search, filter, sort, pagination |
| POST | `/employees` | Create employee |
| GET | `/employees/{id}` | Get single employee |
| PATCH | `/employees/{id}` | Partial update |
| DELETE | `/employees/{id}` | Delete |

**Query params for GET /employees:**
- `search` — name, title, or department (ilike)
- `country`, `department`, `job_title`, `employment_type` — exact filters
- `sort_by` — `full_name`, `salary`, `date_joined`, `country`
- `sort_dir` — `asc` / `desc`
- `page`, `page_size` (max 200)

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees/insights/dashboard` | Summary stats + salary bands |
| GET | `/employees/insights/by-country` | Min/max/avg salary per country |
| GET | `/employees/insights/by-job-title` | Avg salary per job title (optional `?country=`) |
| GET | `/employees/insights/by-department` | Salary range per department |

### Meta (for dropdowns)

| Method | Endpoint |
|--------|----------|
| GET | `/employees/meta/countries` |
| GET | `/employees/meta/departments` |
| GET | `/employees/meta/job-titles` |

---

## Employee Data Model

| Field | Type | Notes |
|-------|------|-------|
| id | int | Auto PK |
| full_name | string | Required |
| email | string | Unique, validated |
| job_title | string | Required |
| department | string | Required |
| country | string | Required |
| salary | decimal(12,2) | Must be > 0 |
| currency | string | e.g. USD, EUR, INR |
| employment_type | enum | Full-Time / Part-Time / Contract / Intern |
| date_joined | date | Required |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

---

## Seed Script Design

The seeder is designed to run fast and be safe to re-run:

- **SQLAlchemy Core bulk insert** — inserts all 10,000 rows in a single `execute()` call with one transaction/fsync. Avoids the per-row overhead of ORM `session.add()`.
- **Single transaction** — all inserts committed atomically; no partial states.
- **Unique emails** — `firstname.lastnameN@company.com` format guarantees no constraint violations across runs.
- **`--clear` flag** — truncates existing data before seeding; safe to run repeatedly.
- **Realistic data** — salary ranges vary by job title, currencies match countries, employment type is weighted (80% Full-Time).

Typical performance: ~2–4 seconds for 10,000 rows on a modern laptop.

---

## Architecture Decisions

### SQLite over PostgreSQL
Chosen for zero-config local setup. SQLAlchemy abstractions mean swapping to PostgreSQL requires only changing `DATABASE_URL` — no model or query changes.

### SQLAlchemy Core for seeding
The ORM adds per-object Python overhead (instantiation, tracking, event hooks). For bulk inserts, Core's `table.insert()` with a list of dicts maps directly to a single parameterized SQL statement — significantly faster at scale.

### React Query for data fetching
Handles caching, background refetch, and loading/error states out of the box. After a mutation (create/edit/delete), `invalidateQueries` ensures the employee list refetches automatically without manual state management.

### Pydantic partial updates (`exclude_unset=True`)
PATCH endpoints use `model_dump(exclude_unset=True)` so only fields explicitly sent in the request body are updated. This prevents accidental nullification of omitted fields.

### In-memory SQLite for tests
Tests use `sqlite:///:memory:` with a per-test transaction rollback. This means:
- No test database files to manage
- Each test starts with a clean slate
- Tests run in < 2 seconds total

---

## Trade-offs & Known Limitations

| Area | Decision | Trade-off |
|------|----------|-----------|
| Database | SQLite | Easy setup, but not suitable for concurrent writes in production |
| Auth | None | Out of scope for this assessment; production would need JWT/OAuth |
| Currency | Stored as string | No real-time exchange rate conversion; all salary comparisons are in local currency |
| Pagination | Offset-based | Simple to implement; keyset pagination would be faster at very large offsets |
| Search | SQL `ILIKE` | Good enough for 10k rows; Elasticsearch/full-text index needed at millions |

---

## AI Tool Usage

This project was built using **Claude (Anthropic)** as the primary AI assistant.

### How AI was used

- **Scaffolding** — initial project structure, FastAPI app setup, SQLAlchemy models
- **Debugging** — Python version compatibility issues (pydantic-core wheel failures on 3.13/3.14), SQLite date type errors in seed script
- **Code generation** — all endpoint implementations, React components, Tailwind styling
- **Test design** — conftest fixtures with in-memory DB + transaction rollback pattern, test case identification for edge cases

### What was validated manually

- All API responses verified against live data via Swagger UI
- Frontend tested against the seeded 10,000-employee dataset
- Test suite reviewed for correctness of assertions and fixture isolation
- Architecture decisions (bulk insert strategy, partial update pattern) were applied intentionally, not just accepted from AI output

### Prompting approach

Requests were kept incremental — one layer at a time (models → schemas → routes → frontend → tests) rather than asking for everything at once. This made it easier to catch issues early and maintain understanding of each piece before moving to the next.