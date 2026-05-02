import { NavLink } from 'react-router-dom';
import {
  TrendingUp, LayoutGrid, Users, Flag,
  BadgeCheck, LogOut, ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/Themecontext';

const NAV = [
  { to: '/kuuza-control/dashboard', label: 'Overview',  icon: TrendingUp },
  { to: '/kuuza-control/listings',  label: 'Listings',  icon: LayoutGrid },
  { to: '/kuuza-control/users',     label: 'Users',     icon: Users },
  { to: '/kuuza-control/reports',   label: 'Reports',   icon: Flag },
  { to: '/kuuza-control/sellers',   label: 'Sellers',   icon: BadgeCheck },
];

const AdminLayout = ({ children, title }) => {
  const { darkMode } = useTheme();
  const { logout } = useAdminAuth();

  const sidebar = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`w-56 shrink-0 flex flex-col border-r sticky top-0 h-screen ${sidebar}`}>

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="leading-none">
            <p className="font-bold text-sm">KUuza</p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Admin Panel</p>
          </div>
        </div>

        <div className={`mx-4 h-px mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? darkMode
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className={`px-3 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              darkMode
                ? 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Page header */}
        {title && (
          <header className={`border-b px-8 py-5 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h1>
          </header>
        )}

        <main className="flex-1 px-8 py-7">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
