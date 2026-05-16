import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getDashboard, getByCountry, getByDepartment, getByJobTitle, getCountries } from "../lib/api";
import { formatSalary, formatNumber } from "../lib/utils";
import { Users, TrendingUp, Globe, Building2 } from "lucide-react";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6"];

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`rounded-xl p-3 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const fmt = (v) => `$${(v / 1000).toFixed(0)}k`;

export default function InsightsPage() {
  const [jobCountry, setJobCountry] = useState("");

  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const { data: byCountry = [] } = useQuery({ queryKey: ["byCountry"], queryFn: getByCountry });
  const { data: byDept = [] } = useQuery({ queryKey: ["byDept"], queryFn: getByDepartment });
  const { data: byJob = [] } = useQuery({
    queryKey: ["byJob", jobCountry],
    queryFn: () => getByJobTitle(jobCountry),
  });
  const { data: countries = [] } = useQuery({ queryKey: ["countries"], queryFn: getCountries });

  const topCountries = byCountry.slice(0, 8);
  const topDepts = byDept.slice(0, 8);
  const topJobs = byJob.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salary Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Org-wide compensation analytics</p>
      </div>

      {/* Stat cards */}
      {dash && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Employees" value={formatNumber(dash.total_employees)} color="blue" />
          <StatCard icon={TrendingUp} label="Avg Salary" value={formatSalary(dash.avg_salary)} color="green" />
          <StatCard icon={Globe} label="Highest Paid Country" value={dash.highest_paid_country} color="purple" />
          <StatCard icon={Building2} label="Largest Department" value={dash.top_department_by_headcount} color="orange" />
        </div>
      )}

      {/* Salary bands */}
      {dash && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Salary Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dash.salary_bands} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="band" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [formatNumber(v), "Employees"]} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By country */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Avg Salary by Country</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topCountries} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => [formatSalary(v), "Avg Salary"]} />
              <Bar dataKey="avg_salary" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Headcount by Country</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={topCountries}
                dataKey="employee_count"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {topCountries.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatNumber(v), "Employees"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By department */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Salary Range by Department</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Department","Employees","Min Salary","Avg Salary","Max Salary"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topDepts.map((d) => (
                <tr key={d.department} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{d.department}</td>
                  <td className="px-3 py-2 text-gray-500">{formatNumber(d.employee_count)}</td>
                  <td className="px-3 py-2 text-gray-600">{formatSalary(d.min_salary)}</td>
                  <td className="px-3 py-2 font-semibold text-blue-600">{formatSalary(d.avg_salary)}</td>
                  <td className="px-3 py-2 text-gray-600">{formatSalary(d.max_salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By job title */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Avg Salary by Job Title</h2>
          <select
            className="input w-48"
            value={jobCountry}
            onChange={(e) => setJobCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topJobs} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="job_title" tick={{ fontSize: 11 }} width={160} />
            <Tooltip formatter={(v) => [formatSalary(v), "Avg Salary"]} />
            <Bar dataKey="avg_salary" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}