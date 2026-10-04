import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';

const DashboardLayout = ({ darkMode, setDarkMode }) => {
  return (
    <div className={darkMode ? 'dark' : ''}>
      <DashboardNavbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
