# Planning & Architecture Notes

## Problem Breakdown

**Given:** Build a salary management tool for 10,000 employees for an HR Manager persona.

**Key requirements identified:**
1. CRUD for employees (name, title, country, salary + meaningful extras)
2. Salary insights — min/max/avg by country, avg by job title in country
3. Backend + UI, seeding with provided name files
4. Production-quality code + tests

---

## Design Decisions (made before writing code)

### What fields belong on an Employee?

Beyond the required fields, I added:
- **email** — essential for any HR system; unique identifier beyond ID
- **department** — enables org-chart insights (headcount, salary by dept)
- **currency** — salary without currency is ambiguous in a multi-country org
- **employment_type** — Full-Time/Part-Time/Contract/Intern affects compensation analysis
- **date_joined** — enables tenure analysis; HR always needs this

### What insights are meaningful for an HR Manager?

Required:
- Min/max/avg salary by country ✓
- Avg salary by job title in a country ✓

Added (genuinely useful for HR):
- **Salary band distribution** — histogram of headcount by salary range; helps spot compression issues
- **Department salary ranges** — min/max/avg per dept; useful for budget planning
- **Highest paid country + largest department** — top-line dashboard stats
- **Headcount by country (pie chart)** — visualises workforce distribution

### API design choices

- **PATCH not PUT** for updates — partial updates only; avoids requiring full payload on every edit
- **Separate `/meta/` endpoints** for dropdown data — frontend can fetch countries/depts/titles independently and cache them
- **Filtering at DB level** — all filters (country, dept, search) applied in SQL, not in Python, so pagination counts are correct
- **Insight endpoints are read-only** — no caching layer needed for 10k rows; SQLite aggregates are fast enough

### Seeder performance strategy

For 10k rows the naive approach (ORM loop) would be slow:
```
# Slow — 10,000 round trips
for row in rows:
    db.add(Employee(**row))
db.commit()
```

Instead, SQLAlchemy Core bulk insert:
```
# Fast — 1 round trip
conn.execute(Employee.__table__.insert(), rows)
```

This is ~10-50x faster for large inserts because:
1. Single prepared statement, not 10,000
2. One transaction commit / fsync
3. No ORM object instantiation overhead

### Test isolation strategy

Each test gets:
1. A fresh in-memory SQLite connection
2. A transaction that wraps the entire test
3. A rollback after the test completes

This means tests never interfere with each other and no cleanup code is needed. The pattern is:

```
connection → begin transaction → run test → rollback → close
```

---

## Testing Approach

Tests were written to validate core business logic and edge cases across
all endpoints. Each test maps directly to a specific business rule:

- Validation rules (negative salary, duplicate email, invalid employment type)
- CRUD correctness (404 on missing resource, 409 on conflict, 204 on delete)
- Aggregation correctness (min/max/avg verified with known controlled inputs)
- Pagination and filtering behaviour

The test suite uses in-memory SQLite with per-test transaction rollback —
fast, isolated, and deterministic. All 30 tests pass in under 2 seconds.

Test-first thinking was applied to the API contract — expected status codes,
validation rules, and response shapes were defined before implementation,
ensuring the code was built to satisfy explicit behavioural requirements.


## What I would add with more time

1. **Authentication** — JWT tokens, role-based access (HR Manager vs read-only)
2. **Export to CSV/Excel** — HR teams always need this
3. **Audit log** — track who changed what salary and when
4. **Bulk operations** — upload CSV to update salaries in bulk
5. **Salary benchmarking** — compare internal salaries against market data
6. **PostgreSQL** — swap SQLite for production-grade concurrent writes
7. **Keyset pagination** — faster than offset at large page numbers
8. **E2E tests** — Playwright tests for critical UI flows