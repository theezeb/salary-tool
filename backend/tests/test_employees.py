"""
test_employees.py — CRUD endpoint tests.
Each test is independent; the DB rolls back after every test.
"""
import pytest


class TestCreateEmployee:
    def test_create_success(self, client, employee_payload):
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["full_name"] == employee_payload["full_name"]
        assert data["email"] == employee_payload["email"]
        assert data["salary"] == employee_payload["salary"]
        assert "id" in data

    def test_create_duplicate_email_returns_409(self, client, employee_payload):
        client.post("/employees", json=employee_payload)
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 409

    def test_create_missing_required_field_returns_422(self, client, employee_payload):
        del employee_payload["full_name"]
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 422

    def test_create_negative_salary_returns_422(self, client, employee_payload):
        employee_payload["salary"] = -1000
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 422

    def test_create_invalid_email_returns_422(self, client, employee_payload):
        employee_payload["email"] = "not-an-email"
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 422

    def test_create_invalid_employment_type_returns_422(self, client, employee_payload):
        employee_payload["employment_type"] = "InvalidType"
        resp = client.post("/employees", json=employee_payload)
        assert resp.status_code == 422


class TestReadEmployee:
    def test_get_existing_employee(self, client, created_employee):
        emp_id = created_employee["id"]
        resp = client.get(f"/employees/{emp_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == emp_id

    def test_get_nonexistent_employee_returns_404(self, client):
        resp = client.get("/employees/999999")
        assert resp.status_code == 404

    def test_list_employees_returns_paginated(self, client, created_employee):
        resp = client.get("/employees?page=1&page_size=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "results" in data
        assert data["total"] >= 1

    def test_list_employees_search(self, client, created_employee):
        resp = client.get("/employees?search=Jane")
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert any("Jane" in e["full_name"] for e in results)

    def test_list_employees_filter_by_country(self, client, created_employee):
        resp = client.get("/employees?country=United States")
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert all(e["country"] == "United States" for e in results)

    def test_list_employees_filter_by_department(self, client, created_employee):
        resp = client.get("/employees?department=Engineering")
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert all(e["department"] == "Engineering" for e in results)

    def test_list_employees_sort_by_salary_desc(self, client, employee_payload):
        # Create two employees with different salaries
        client.post("/employees", json={**employee_payload, "salary": 50000, "email": "low@company.com"})
        client.post("/employees", json={**employee_payload, "salary": 150000, "email": "high@company.com"})
        resp = client.get("/employees?sort_by=salary&sort_dir=desc&page_size=5")
        assert resp.status_code == 200
        salaries = [e["salary"] for e in resp.json()["results"]]
        assert salaries == sorted(salaries, reverse=True)

    def test_list_pagination_page_size(self, client, employee_payload):
        # Create 3 employees
        for i in range(3):
            client.post("/employees", json={**employee_payload, "email": f"user{i}@company.com"})
        resp = client.get("/employees?page=1&page_size=2")
        assert resp.status_code == 200
        assert len(resp.json()["results"]) <= 2


class TestUpdateEmployee:
    def test_update_salary(self, client, created_employee):
        emp_id = created_employee["id"]
        resp = client.patch(f"/employees/{emp_id}", json={"salary": 120000})
        assert resp.status_code == 200
        assert resp.json()["salary"] == 120000

    def test_update_job_title(self, client, created_employee):
        emp_id = created_employee["id"]
        resp = client.patch(f"/employees/{emp_id}", json={"job_title": "Senior Software Engineer"})
        assert resp.status_code == 200
        assert resp.json()["job_title"] == "Senior Software Engineer"

    def test_update_email_to_existing_returns_409(self, client, employee_payload):
        emp1 = client.post("/employees", json=employee_payload).json()
        payload2 = {**employee_payload, "email": "other@company.com"}
        emp2 = client.post("/employees", json=payload2).json()
        # Try to update emp2's email to emp1's email
        resp = client.patch(f"/employees/{emp2['id']}", json={"email": employee_payload["email"]})
        assert resp.status_code == 409

    def test_update_nonexistent_returns_404(self, client):
        resp = client.patch("/employees/999999", json={"salary": 100000})
        assert resp.status_code == 404

    def test_partial_update_preserves_other_fields(self, client, created_employee):
        emp_id = created_employee["id"]
        original_name = created_employee["full_name"]
        client.patch(f"/employees/{emp_id}", json={"salary": 99000})
        resp = client.get(f"/employees/{emp_id}")
        assert resp.json()["full_name"] == original_name
        assert resp.json()["salary"] == 99000


class TestDeleteEmployee:
    def test_delete_existing_employee(self, client, created_employee):
        emp_id = created_employee["id"]
        resp = client.delete(f"/employees/{emp_id}")
        assert resp.status_code == 204

    def test_deleted_employee_not_found(self, client, created_employee):
        emp_id = created_employee["id"]
        client.delete(f"/employees/{emp_id}")
        resp = client.get(f"/employees/{emp_id}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/employees/999999")
        assert resp.status_code == 404