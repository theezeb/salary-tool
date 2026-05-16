"""
test_insights.py — Tests for all salary insight endpoints.
"""


def make_employee(client, overrides={}):
    base = {
        "full_name": "Test User",
        "email": "test@company.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "United States",
        "salary": 100000,
        "currency": "USD",
        "employment_type": "Full-Time",
        "date_joined": "2022-06-01",
    }
    return client.post("/employees", json={**base, **overrides}).json()


class TestCountryInsights:
    def test_by_country_returns_list(self, client):
        make_employee(client, {"email": "a@c.com", "country": "United States", "salary": 100000})
        make_employee(client, {"email": "b@c.com", "country": "India", "salary": 60000})
        resp = client.get("/employees/insights/by-country")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_by_country_correct_aggregates(self, client):
        make_employee(client, {"email": "x1@c.com", "country": "Germany", "salary": 80000})
        make_employee(client, {"email": "x2@c.com", "country": "Germany", "salary": 120000})
        resp = client.get("/employees/insights/by-country")
        germany = next((r for r in resp.json() if r["country"] == "Germany"), None)
        assert germany is not None
        assert germany["min_salary"] == 80000
        assert germany["max_salary"] == 120000
        assert germany["avg_salary"] == 100000
        assert germany["employee_count"] == 2

    def test_by_country_single_employee(self, client):
        make_employee(client, {"email": "solo@c.com", "country": "Canada", "salary": 75000})
        resp = client.get("/employees/insights/by-country")
        canada = next((r for r in resp.json() if r["country"] == "Canada"), None)
        assert canada is not None
        assert canada["min_salary"] == canada["max_salary"] == canada["avg_salary"]


class TestJobTitleInsights:
    def test_by_job_title_returns_list(self, client):
        make_employee(client, {"email": "j1@c.com"})
        resp = client.get("/employees/insights/by-job-title")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_by_job_title_filter_by_country(self, client):
        make_employee(client, {"email": "j2@c.com", "country": "Australia", "job_title": "Data Analyst", "salary": 90000})
        make_employee(client, {"email": "j3@c.com", "country": "France", "job_title": "Data Analyst", "salary": 70000})
        resp = client.get("/employees/insights/by-job-title?country=Australia")
        results = resp.json()
        assert all(r["country"] == "Australia" for r in results)

    def test_by_job_title_avg_is_correct(self, client):
        make_employee(client, {"email": "d1@c.com", "job_title": "DevOps Engineer", "country": "Singapore", "salary": 100000})
        make_employee(client, {"email": "d2@c.com", "job_title": "DevOps Engineer", "country": "Singapore", "salary": 200000})
        resp = client.get("/employees/insights/by-job-title?country=Singapore")
        devops = next((r for r in resp.json() if r["job_title"] == "DevOps Engineer"), None)
        assert devops is not None
        assert devops["avg_salary"] == 150000


class TestDepartmentInsights:
    def test_by_department_returns_list(self, client):
        make_employee(client, {"email": "dept1@c.com"})
        resp = client.get("/employees/insights/by-department")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_by_department_correct_fields(self, client):
        make_employee(client, {"email": "dept2@c.com", "department": "Finance", "salary": 60000})
        make_employee(client, {"email": "dept3@c.com", "department": "Finance", "salary": 90000})
        resp = client.get("/employees/insights/by-department")
        finance = next((r for r in resp.json() if r["department"] == "Finance"), None)
        assert finance is not None
        assert finance["min_salary"] == 60000
        assert finance["max_salary"] == 90000
        assert finance["employee_count"] == 2


class TestDashboard:
    def test_dashboard_returns_correct_shape(self, client):
        make_employee(client, {"email": "dash1@c.com", "salary": 80000})
        resp = client.get("/employees/insights/dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_employees" in data
        assert "avg_salary" in data
        assert "highest_paid_country" in data
        assert "top_department_by_headcount" in data
        assert "salary_bands" in data

    def test_dashboard_total_employees_count(self, client):
        make_employee(client, {"email": "cnt1@c.com"})
        make_employee(client, {"email": "cnt2@c.com"})
        resp = client.get("/employees/insights/dashboard")
        assert resp.json()["total_employees"] >= 2

    def test_dashboard_salary_bands_cover_all(self, client):
        make_employee(client, {"email": "band1@c.com", "salary": 25000})
        make_employee(client, {"email": "band2@c.com", "salary": 75000})
        make_employee(client, {"email": "band3@c.com", "salary": 200000})
        resp = client.get("/employees/insights/dashboard")
        bands = resp.json()["salary_bands"]
        assert len(bands) == 5
        total = sum(b["count"] for b in bands)
        assert total >= 3


class TestMetaEndpoints:
    def test_countries_returns_list(self, client):
        make_employee(client, {"email": "meta1@c.com", "country": "Brazil"})
        resp = client.get("/employees/meta/countries")
        assert resp.status_code == 200
        assert "Brazil" in resp.json()

    def test_departments_returns_list(self, client):
        make_employee(client, {"email": "meta2@c.com", "department": "Legal"})
        resp = client.get("/employees/meta/departments")
        assert resp.status_code == 200
        assert "Legal" in resp.json()

    def test_job_titles_returns_list(self, client):
        make_employee(client, {"email": "meta3@c.com", "job_title": "Recruiter"})
        resp = client.get("/employees/meta/job-titles")
        assert resp.status_code == 200
        assert "Recruiter" in resp.json()