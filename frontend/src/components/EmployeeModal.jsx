import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEmployee, updateEmployee } from "../lib/api";

const COUNTRIES = [
  "United States", "United Kingdom", "India", "Germany", "Canada",
  "Australia", "Singapore", "France", "Netherlands", "Brazil",
];
const DEPARTMENTS = [
  "Engineering", "Product", "Data", "HR", "Finance",
  "Marketing", "Sales", "Design", "Operations", "Legal", "Customer Success",
];
const JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Engineer",
  "Engineering Manager", "Product Manager", "Data Analyst", "Data Scientist",
  "HR Specialist", "HR Manager", "Recruiter", "Finance Analyst", "Accountant",
  "Marketing Manager", "Sales Representative", "Sales Manager",
  "UX Designer", "UI Designer", "DevOps Engineer", "QA Engineer",
  "Legal Counsel", "Operations Manager", "Customer Success Manager",
];
const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern"];

const EMPTY = {
  full_name: "", email: "", job_title: "", department: "",
  country: "", salary: "", currency: "USD",
  employment_type: "Full-Time", date_joined: "",
};

export default function EmployeeModal({ open, onClose, employee }) {
  const qc = useQueryClient();
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(employee ? { ...employee, salary: String(employee.salary) } : EMPTY);
      setErrors({});
    }
  }, [open, employee]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateEmployee(employee.id, data) : createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
  });

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.job_title) e.job_title = "Required";
    if (!form.department) e.department = "Required";
    if (!form.country) e.country = "Required";
    if (!form.salary || isNaN(Number(form.salary)) || Number(form.salary) <= 0)
      e.salary = "Must be a positive number";
    if (!form.date_joined) e.date_joined = "Required";
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    mutation.mutate({ ...form, salary: Number(form.salary) });
  }

  function field(key, label, type = "text", opts = null) {
    return (
      <div>
        <label className="label">{label}</label>
        {opts ? (
          <select
            className="input"
            value={form[key]}
            onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
          >
            <option value="">Select…</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            className="input"
            type={type}
            value={form[key]}
            onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
          />
        )}
        {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">{field("full_name", "Full Name")}</div>
          <div className="col-span-2">{field("email", "Email", "email")}</div>
          {field("job_title", "Job Title", "text", JOB_TITLES)}
          {field("department", "Department", "text", DEPARTMENTS)}
          {field("country", "Country", "text", COUNTRIES)}
          <div>
            <label className="label">Salary</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.salary}
              onChange={(ev) => setForm((f) => ({ ...f, salary: ev.target.value }))}
            />
            {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
          </div>
          {field("currency", "Currency", "text", ["USD","GBP","EUR","INR","CAD","AUD","SGD","BRL"])}
          {field("employment_type", "Employment Type", "text", EMPLOYMENT_TYPES)}
          <div>
            <label className="label">Date Joined</label>
            <input
              className="input"
              type="date"
              value={form.date_joined}
              onChange={(ev) => setForm((f) => ({ ...f, date_joined: ev.target.value }))}
            />
            {errors.date_joined && <p className="text-red-500 text-xs mt-1">{errors.date_joined}</p>}
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}
            </button>
          </div>

          {mutation.isError && (
            <p className="col-span-2 text-red-500 text-sm">
              {mutation.error?.response?.data?.detail || "Something went wrong."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}