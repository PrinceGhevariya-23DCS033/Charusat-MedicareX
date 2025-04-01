import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import CounselorDashboard from './dashboards/CounselorDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  const DashboardComponent = {
    patient: PatientDashboard,
    doctor: DoctorDashboard,
    admin: AdminDashboard,
    counselor: CounselorDashboard,
  }[user.role];

  return (
    <Routes>
      <Route path="/" element={<DashboardComponent />} />
    </Routes>
  );
}

export default Dashboard;