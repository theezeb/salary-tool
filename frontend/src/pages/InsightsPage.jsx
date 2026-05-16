import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getDashboard,
  getByCountry,
  getByDepartment,
  getByJobTitle,
  getCountries,
} from '../lib/api';
import { formatSalary, formatNumber } from '../lib/utils';
import { Users, TrendingUp, Globe, Building2 } from 'lucide-react';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#14b8a6',
];

const fmt = (v) => `$${(v / 1000).toFixed(0)}k`;

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
      }}
    >
      <p
        className="font-semibold mb-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'var(--text-primary)' }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay = '' }) {
  const colors = {
    blue: { bg: 'var(--accent-light)', icon: 'var(--accent)' },
    green: { bg: 'var(--success-light)', icon: 'var(--success)' },
    purple: { bg: 'var(--purple-light)', icon: 'var(--purple)' },
    orange: { bg: 'var(--warning-light)', icon: 'var(--warning)' },
  };
  return (
    <div className={`card flex items-center gap-4 p-5 ${delay}`}>
      <div
        className="rounded-xl p-3 flex-shrink-0"
        style={{ backgroundColor: colors[color].bg }}
      >
        <Icon size={20} style={{ color: colors[color].icon }} />
      </div>
      <div className="min-w-0">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <p
          className="text-xl font-bold mt-0.5 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [jobCountry, setJobCountry] = useState('');

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
  const { data: byCountry = [] } = useQuery({
    queryKey: ['byCountry'],
    queryFn: getByCountry,
  });
  const { data: byDept = [] } = useQuery({
    queryKey: ['byDept'],
    queryFn: getByDepartment,
  });
  const { data: byJob = [] } = useQuery({
    queryKey: ['byJob', jobCountry],
    queryFn: () => getByJobTitle(jobCountry),
  });
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
  });

  const topCountries = byCountry.slice(0, 8);
  const topJobs = byJob.slice(0, 10);
  const topDepts = byDept.slice(0, 11);

  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 };

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Salary Insights
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Org-wide compensation analytics
        </p>
      </div>

      {/* Stat cards */}
      {dash && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={formatNumber(dash.total_employees)}
            color="blue"
            delay="fade-up-1"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Salary"
            value={formatSalary(dash.avg_salary)}
            color="green"
            delay="fade-up-2"
          />
          <StatCard
            icon={Globe}
            label="Highest Paid Country"
            value={dash.highest_paid_country}
            color="purple"
            delay="fade-up-3"
          />
          <StatCard
            icon={Building2}
            label="Largest Department"
            value={dash.top_department_by_headcount}
            color="orange"
            delay="fade-up-4"
          />
        </div>
      )}

      {/* Salary bands */}
      {dash && (
        <div className="card fade-up-2">
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-5"
            style={{ color: 'var(--text-muted)' }}
          >
            Salary Band Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dash.salary_bands}
              margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="band"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(v) => `${formatNumber(v)} employees`}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Country charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card fade-up-1">
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-5"
            style={{ color: 'var(--text-muted)' }}
          >
            Avg Salary by Country
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={topCountries}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <XAxis
                type="number"
                tickFormatter={fmt}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="country"
                tick={axisStyle}
                width={105}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip formatter={(v) => formatSalary(v)} />}
              />
              <Bar
                dataKey="avg_salary"
                fill="var(--success)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-up-2">
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-5"
            style={{ color: 'var(--text-muted)' }}
          >
            Headcount by Country
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={topCountries}
                dataKey="employee_count"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={45}
                paddingAngle={2}
              >
                {topCountries.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(v) => `${formatNumber(v)} employees`}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {topCountries.map((c, i) => (
              <div
                key={c.country}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {c.country}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department table */}
      <div className="card fade-up-3">
        <h2
          className="text-sm font-bold uppercase tracking-wider mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Salary Range by Department
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Department', 'Employees', 'Min', 'Average', 'Max'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {topDepts.map((d, i) => (
                <tr
                  key={d.department}
                  style={{
                    borderBottom:
                      i < topDepts.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--surface-2)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td
                    className="px-3 py-3 font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {d.department}
                  </td>
                  <td
                    className="px-3 py-3 text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatNumber(d.employee_count)}
                  </td>
                  <td
                    className="px-3 py-3 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {formatSalary(d.min_salary)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="font-bold text-sm"
                      style={{ color: 'var(--accent)' }}
                    >
                      {formatSalary(d.avg_salary)}
                    </span>
                  </td>
                  <td
                    className="px-3 py-3 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {formatSalary(d.max_salary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job title chart */}
      <div className="card fade-up-4">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Avg Salary by Job Title
          </h2>
          <select
            className="input w-44 text-xs"
            value={jobCountry}
            onChange={(e) => setJobCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={topJobs}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <XAxis
              type="number"
              tickFormatter={fmt}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="job_title"
              tick={axisStyle}
              width={165}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => formatSalary(v)} />}
            />
            <Bar
              dataKey="avg_salary"
              fill="var(--purple)"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
