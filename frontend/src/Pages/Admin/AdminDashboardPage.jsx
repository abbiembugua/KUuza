import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Flag, BadgeCheck, Loader2, AlertTriangle } from 'lucide-react';
import PageSpinner from '../../Components/shared/PageSpinner';
import { toast, Toaster } from 'react-hot-toast';
import { fetchDashboardStats } from '../../api/adminapi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/Themecontext';
import AdminLayout from './AdminLayout';

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full text-left rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
        darkMode
          ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      {value === null ? (
        <div className={`h-8 w-16 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
      ) : (
        <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      )}
    </button>
  );
};

const AdminDashboardPage = () => {
  const { adminUser, adminLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    if (!adminUser) { navigate('/kuuza-control/'); return; }
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => toast.error(e.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [adminUser, adminLoading, navigate]);

  const cards = [
    { icon: LayoutGrid,    label: 'Active Listings',      value: stats?.total_listings     ?? null, color: 'bg-emerald-500', to: '/kuuza-control/listings' },
    { icon: Users,         label: 'Registered Users',     value: stats?.total_users        ?? null, color: 'bg-sky-500',     to: '/kuuza-control/users' },
    { icon: Flag,          label: 'Pending Reports',      value: stats?.pending_reports    ?? null, color: 'bg-amber-500',   to: '/kuuza-control/reports' },
    { icon: BadgeCheck,    label: 'Verified Sellers',     value: stats?.verified_sellers   ?? null, color: 'bg-violet-500',  to: '/kuuza-control/sellers' },
    { icon: AlertTriangle, label: 'Escalated Disputes',   value: stats?.escalated_disputes ?? null, color: 'bg-red-500',     to: '/kuuza-control/disputes' },
  ];

  if (adminLoading) return (
    <AdminLayout title="Overview">
      <PageSpinner />
    </AdminLayout>
  );

  return (
    <AdminLayout title="Overview">
      <Toaster position="top-center" />

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {cards.map((c) => (
            <StatCard key={c.to} {...c} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
