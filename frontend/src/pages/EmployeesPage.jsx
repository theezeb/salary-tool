import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from 'lucide-react';

import { getEmployees, getCountries, getDepartments } from '../lib/api';
import { formatSalary } from '../lib/utils';

import EmployeeModal from '../components/EmployeeModal';
import DeleteModal from '../components/DeleteModal';

const PAGE_SIZE = 20;

const TYPE_STYLES = {
  'Full-Time': { bg: 'var(--success-light)', color: 'var(--success)' },
  'Part-Time': { bg: 'var(--warning-light)', color: 'var(--warning)' },
  Contract: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  Intern: { bg: 'var(--purple-light)', color: 'var(--purple)' },
};

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col)
    return <ChevronsUpDown size={13} style={{ color: 'var(--text-muted)' }} />;
  return sortDir === 'asc' ? (
    <ChevronUp size={13} style={{ color: 'var(--accent)' }} />
  ) : (
    <ChevronDown size={13} style={{ color: 'var(--accent)' }} />
  );
}

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [country, setCountry] = useState('');
  const [department, setDepartment] = useState('');
  const [sortBy, setSortBy] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Main employees query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'employees',
      { page, country, department, sortBy, sortDir, search: debouncedSearch },
    ],
    queryFn: () =>
      getEmployees({
        page,
        page_size: PAGE_SIZE,
        country,
        department,
        sort_by: sortBy,
        sort_dir: sortDir,
        search: debouncedSearch,
      }),
    keepPreviousData: true,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const displayResults = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  const hasFilters = country || department || search;

  const COLS = [
    { col: 'full_name', label: 'Name' },
    { col: 'department', label: 'Department' },
    { col: 'job_title', label: 'Job Title' },
    { col: 'country', label: 'Country' },
    { col: 'employment_type', label: 'Type' },
    { col: 'salary', label: 'Salary' },
    { col: 'date_joined', label: 'Joined' },
    { col: null, label: '' },
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Employees
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data
              ? `${data.total.toLocaleString()} total employees`
              : 'Loading…'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.5} />
          Add Employee
        </button>
      </div>

      {/* Search + Filters */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-3 items-center"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            className="input pl-9 pr-8"
            placeholder="Search by name, title, email globally…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              onClick={() => setSearch('')}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="input w-44"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          style={{
            color: country ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input w-44"
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          style={{
            color: department ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            className="btn-ghost text-xs gap-1.5"
            onClick={() => {
              setCountry('');
              setDepartment('');
              setSearch('');
              setPage(1);
            }}
            style={{ color: 'var(--danger)' }}
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden fade-up-1"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>

            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {COLS.map(({ col, label }) => (
                  <th
                    key={label || 'actions'}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                      col ? 'cursor-pointer select-none' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--text-muted)',
                    }}
                    onClick={() => col && handleSort(col)}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      {col && (
                        <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Loading, Error, Empty states... (unchanged) */}
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--accent)' }}
                      />
                      Loading employees…
                    </div>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-sm"
                    style={{ color: 'var(--danger)' }}
                  >
                    Failed to load employees. Check your connection.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && displayResults.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No employees match your search criteria.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                displayResults.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className="fade-in"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s',
                      animationDelay: `${i * 0.015}s`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'var(--surface-2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    {/* Rest of your row rendering (unchanged) */}
                    <td className="px-4 py-3.5">
                      <div
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {emp.full_name}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {emp.email}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {emp.department}
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {emp.job_title}
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {emp.country}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor:
                            TYPE_STYLES[emp.employment_type]?.bg ||
                            'var(--surface-2)',
                          color:
                            TYPE_STYLES[emp.employment_type]?.color ||
                            'var(--text-secondary)',
                        }}
                      >
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="font-semibold text-sm"
                        style={{
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatSalary(emp.salary, emp.currency)}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm"
                      style={{
                        color: 'var(--text-muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {emp.date_joined}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'var(--accent-light)';
                            e.currentTarget.style.color = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                          onClick={() => setEditTarget(emp)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'var(--danger-light)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                          onClick={() => setDeleteTarget(emp)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
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
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-2)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {data.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, data.total)}
              </span>{' '}
              of{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {data.total.toLocaleString()}
              </span>{' '}
              employees
            </p>

            <div className="flex items-center gap-2">
              <button
                className="btn-secondary py-1 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <span
                className="text-xs px-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                className="btn-secondary py-1 px-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployeeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        employee={null}
      />
      <EmployeeModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        employee={editTarget}
      />
      <DeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        employee={deleteTarget}
      />
    </div>
  );
}

/* ==================== PropTypes ==================== */

EmployeesPage.propTypes = {
  // Currently no props are used. Add here when needed (e.g. from router)
};

SortIcon.propTypes = {
  col: PropTypes.string,
  sortBy: PropTypes.string.isRequired,
  sortDir: PropTypes.oneOf(['asc', 'desc']).isRequired,
};
