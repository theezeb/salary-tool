import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// ── Employees ─────────────────────────────────────────────────────────────────

export const getEmployees = (params) =>
  api.get("/employees", { params }).then((r) => r.data);

export const getEmployee = (id) =>
  api.get(`/employees/${id}`).then((r) => r.data);

export const createEmployee = (data) =>
  api.post("/employees", data).then((r) => r.data);

export const updateEmployee = (id, data) =>
  api.patch(`/employees/${id}`, data).then((r) => r.data);

export const deleteEmployee = (id) =>
  api.delete(`/employees/${id}`).then((r) => r.data);

// ── Meta (dropdowns) ──────────────────────────────────────────────────────────

export const getCountries = () =>
  api.get("/employees/meta/countries").then((r) => r.data);

export const getDepartments = () =>
  api.get("/employees/meta/departments").then((r) => r.data);

export const getJobTitles = () =>
  api.get("/employees/meta/job-titles").then((r) => r.data);

// ── Insights ──────────────────────────────────────────────────────────────────

export const getDashboard = () =>
  api.get("/employees/insights/dashboard").then((r) => r.data);

export const getByCountry = () =>
  api.get("/employees/insights/by-country").then((r) => r.data);

export const getByJobTitle = (country) =>
  api
    .get("/employees/insights/by-job-title", { params: country ? { country } : {} })
    .then((r) => r.data);

export const getByDepartment = () =>
  api.get("/employees/insights/by-department").then((r) => r.data);