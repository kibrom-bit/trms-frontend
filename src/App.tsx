import React, { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  IconLayoutDashboard,
  IconBuilding,
  IconClipboardList,
  IconChartBar,
  IconMenu2,
  IconX,
  IconBell,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";

// Pages (Stubs for now, will implement in following phases)
import Login from "./features/auth/Login";
import CreateReferral from "./features/referrals/CreateReferral";
import Dashboard from "./features/dashboard/Dashboard";
import Directory from "./features/directory/Directory";
import Triage from "./features/triage/Triage";
import Analytics from "./features/analytics/Analytics";
import FacilityManager from "./features/admin/FacilityManager";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const navItems = [
    { path: "/", icon: IconLayoutDashboard, label: "Command Center" },
  ];

  // Role-Based Navigation Filtering
  if (user?.role !== 'system_admin') {
    if (user?.role === 'liaison_officer' || user?.role === 'facility_admin') {
      navItems.push({ path: "/triage", icon: IconClipboardList, label: "Referral Triage" });
    }
    navItems.push({ path: "/directory", icon: IconBuilding, label: "Facility Network" });
    navItems.push({ path: "/analytics", icon: IconChartBar, label: "Analytics" });
  }

  if (user?.role === 'system_admin') {
    navItems.push({ path: "/admin/facilities", icon: IconUser, label: "Manage System" });
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-surface-900 border-r border-primary-200 dark:border-primary-800 transition-transform lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-primary-200 dark:border-primary-800">
          <span className="text-xl font-bold tracking-tight uppercase">TRMS</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-primary-900 text-white' 
                  : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-surface-800'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3 px-3 py-2 border border-primary-100 dark:border-primary-800 rounded bg-primary-50/50 dark:bg-surface-950/50">
            <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-200 uppercase font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate dark:text-white uppercase">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-primary-500 uppercase tracking-tighter">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={logout}
              className="text-primary-400 hover:text-error transition-colors"
              title="Logout"
            >
              <IconLogout size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-surface-900 border-b border-primary-200 dark:border-primary-800 lg:px-8">
          <button 
            className="lg:hidden p-2 -ml-2 text-primary-600 dark:text-primary-400"
            onClick={() => setIsSidebarOpen(true)}
          >
            <IconMenu2 size={24} />
          </button>
          
          <div className="flex-1 px-4">
             <h2 className="text-sm font-bold text-primary-400 uppercase tracking-widest hidden lg:block"> Referral Management Engine</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-primary-400 hover:text-primary-900 dark:hover:text-white transition-colors">
              <IconBell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface-50 dark:bg-surface-950">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/triage" element={
              <ProtectedRoute>
                <Triage />
              </ProtectedRoute>
            } />
            <Route path="/referrals/new" element={
              <ProtectedRoute>
                <CreateReferral />
              </ProtectedRoute>
            } />
            <Route path="/directory" element={
              <ProtectedRoute>
                <Directory />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/facilities" element={
              <ProtectedRoute>
                <FacilityManager />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
