import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/Themecontext';
import AdminLayout from './AdminLayout';
import PageSpinner from '../../Components/shared/PageSpinner';

import ListingsSection from './sections/ListingsSection';
import UsersSection    from './sections/UsersSection';
import ReportsSection  from './sections/ReportsSection';
import SellersSection  from './sections/SellersSection';
import DisputesSection from './sections/DisputesSection';

const TITLES = {
  listings: 'Listings',
  users:    'Users',
  reports:  'Reports',
  disputes: 'Disputes',
  sellers:  'Sellers',
};

const AdminManagePage = ({ section }) => {
  const { darkMode } = useTheme();
  const { adminUser, adminLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminLoading) return;
    if (!adminUser) navigate('/kuuza-control/');
  }, [adminUser, adminLoading, navigate]);

  if (adminLoading) return (
    <AdminLayout title={TITLES[section] ?? 'Management'}>
      <PageSpinner />
    </AdminLayout>
  );

  return (
    <AdminLayout title={TITLES[section] ?? 'Management'}>
      <Toaster position="top-center" />
      {section === 'listings' && <ListingsSection darkMode={darkMode} />}
      {section === 'users'    && <UsersSection    darkMode={darkMode} />}
      {section === 'reports'  && <ReportsSection  darkMode={darkMode} />}
      {section === 'disputes' && <DisputesSection darkMode={darkMode} />}
      {section === 'sellers'  && <SellersSection  darkMode={darkMode} />}
    </AdminLayout>
  );
};

export default AdminManagePage;
