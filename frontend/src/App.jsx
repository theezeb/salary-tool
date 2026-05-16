import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Users, BarChart2, Building2, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import EmployeesPage from './pages/EmployeesPage';
import InsightsPage from './pages/InsightsPage';

const NAV = [
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/insights', label: 'Insights', icon: BarChart2 },
];

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="btn-ghost p-2 rounded-lg"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ color: 'var(--text-secondary)' }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function Layout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-14">
          <div
            className="flex items-center gap-2 font-bold text-base"
            style={{ color: 'var(--accent)' }}
          >
            <Building2 size={20} />
            <span>SalaryTool</span>
          </div>

          <nav className="flex gap-1 flex-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive ? 'active-nav' : 'inactive-nav'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? 'var(--accent-light)'
                    : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                })}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
