import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { getEmployees, getCountries, getDepartments } from "../lib/api";
import { formatSalary } from "../lib/utils";
import EmployeeModal from "../components/EmployeeModal";
import DeleteModal from "../components/DeleteModal";

const PAGE_SIZE = 20;

const BADGE = {
  "Full-Time": "bg-green-100 text-green-700",
  "Part-Time": "bg-yellow-100 text-yellow-700",
  "Contract": "bg-blue-100 text-blue-700",
  "Intern": "bg-purple-100 text-purple-700",
};

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [department, setDepartment] = useState("");
  const [sortBy, setSortBy] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", { page, search, country, department, sortBy, sortDir }],
    queryFn: () =>
      getEmployees({ page, page_size: PAGE_SIZE, search, country, department, sort_by: sortBy, sort_dir: sortDir }),
    keepPreviousData: true,
  });

  const { data: countries = [] } = useQuery({ queryKey: ["countries"], queryFn: getCountries });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function handleSearch(e) { setSearch(e.target.value); setPage(1); }
  function handleSort(col) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `${data.total.toLocaleString()} total employees` : "Loading…"}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search name, title, department…"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <select
          className="input w-48"
          value={country}
          onChange={(e) => { setCountry(e.target.value); setPage(1); }}
        >
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input w-48"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { col: "full_name", label: "Name" },
                  { col: null, label: "Department" },
                  { col: "job_title", label: "Job Title" },
                  { col: "country", label: "Country" },
                  { col: null, label: "Type" },
                  { col: "salary", label: "Salary" },
                  { col: "date_joined", label: "Joined" },
                  { col: null, label: "" },
                ].map(({ col, label }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap ${col ? "cursor-pointer hover:text-gray-900 select-none" : ""}`}
                    onClick={() => col && handleSort(col)}
                  >
                    {label}{col && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
              )}
              {isError && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-red-500">Failed to load employees.</td></tr>
              )}
              {data?.results.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{emp.full_name}</div>
                    <div className="text-gray-400 text-xs">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.job_title}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.country}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${BADGE[emp.employment_type] || "bg-gray-100 text-gray-600"}`}>
                      {emp.employment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatSalary(emp.salary, emp.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.date_joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={() => setEditTarget(emp)}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => setDeleteTarget(emp)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-2 py-1"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                className="btn-secondary px-2 py-1"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <EmployeeModal open={addOpen} onClose={() => setAddOpen(false)} employee={null} />
      <EmployeeModal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} employee={editTarget} />
      <DeleteModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} employee={deleteTarget} />
    </div>
  );
}