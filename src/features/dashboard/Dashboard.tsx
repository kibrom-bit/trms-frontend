import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import ClinicianManager from '../admin/ClinicianManager';

// Lazy load role-based dashboards
const DoctorDashboard = lazy(() => import('./views/DoctorDashboard'));
const LiaisonDashboard = lazy(() => import('./views/LiaisonDashboard'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const FacilityAdminDashboard = lazy(() => import('./views/FacilityAdminDashboard'));

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const renderDashboard = () => {
    switch (role) {
      case 'system_admin':
        return <AdminDashboard />;
      case 'facility_admin':
        return <FacilityAdminDashboard />;
      case 'department_head':
        return <ClinicianManager />;
      case 'liaison_officer':
        return <LiaisonDashboard />;
      case 'doctor':
      case 'hew':
        return <DoctorDashboard />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 border border-primary-100 rounded bg-white dark:bg-surface-900">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary-400">Unauthorized Access</h2>
            <p className="text-xs text-primary-500 mt-2">Your role is not recognized for this view.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full font-sans">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-900 rounded-full animate-spin" />
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Constructing Command Center...</span>
        </div>
      }>
        {renderDashboard()}
      </Suspense>
    </div>
  );
}
