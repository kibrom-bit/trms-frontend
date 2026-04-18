import React, { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useNotifications } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NotificationBanners } from "./components/ui/NotificationBanners";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./services/api";
import { Facility } from "./types/api";
import { getBackendUrl } from "./utils/url-utils";
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
import { Toaster } from "react-hot-toast";

// Pages (Stubs for now, will implement in following phases)
import Login from "./features/auth/Login";
import CreateReferral from "./features/referrals/CreateReferral";
import Dashboard from "./features/dashboard/Dashboard";
import Directory from "./features/directory/Directory";
import Triage from "./features/triage/Triage";
import Analytics from "./features/analytics/Analytics";
import FacilityManager from "./features/admin/FacilityManager";
import DepartmentManager from "./features/admin/DepartmentManager";
import ClinicianManager from "./features/admin/ClinicianManager";
import FacilityDetailView from "./features/admin/FacilityDetailView";

import { NotificationPopover } from "./components/ui/NotificationPopover";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: myFacility } = useQuery({
    queryKey: ["my-facility", user?.facilityId],
    queryFn: async () => {
      const r = await apiClient.get<Facility>(`/facilities/${user?.facilityId}`);
      return r.data;
    },
    enabled: !!user?.facilityId,
  });

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const navItems = [];

  // Role-Based Navigation Filtering
  if (user?.role === 'facility_admin') {
    // Only show relevant management sections
    navItems.push({ path: "/admin/departments", icon: IconBuilding, label: "Internal Units" });
  }

  if (user?.role === 'system_admin') {
     navItems.push({ path: "/", icon: IconLayoutDashboard, label: "Command Center" });
     navItems.push({ path: "/admin/facilities", icon: IconUser, label: "Manage System" });
     navItems.push({ path: "/directory", icon: IconBuilding, label: "Facility Network" });
     navItems.push({ path: "/analytics", icon: IconChartBar, label: "Analytics" });
  }

  if (user?.role === 'liaison_officer') {
    navItems.push({ path: "/", icon: IconLayoutDashboard, label: "Liaison Console" });
    navItems.push({ path: "/directory", icon: IconBuilding, label: "Facility Network" });
  }

  if (user?.role === 'department_head') {
    navItems.push({ path: "/department/staff", icon: IconUser, label: "Manage Staff" });
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col font-sans">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'text-xs font-black uppercase tracking-widest',
          style: {
            borderRadius: '1rem',
            background: '#1a1a1a',
            color: '#fff',
          },
        }}
      />
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 h-20 bg-white dark:bg-surface-900 border-b border-primary-100 dark:border-primary-800 px-6 lg:px-12 flex items-center justify-between shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-900/20 group-hover:scale-105 transition-transform">T</div>
            <span className="text-xl font-black tracking-tighter uppercase dark:text-white group-hover:text-primary-900 transition-colors">TRMS</span>
          </NavLink>

          {user?.facilityId ? (
            <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-primary-100 dark:border-primary-800">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 overflow-hidden flex items-center justify-center">
                {myFacility?.profileImageUrl ? (
                  <img
                    src={getBackendUrl(myFacility.profileImageUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black text-primary-600">
                    {(myFacility?.name || user?.facilityName || "F").charAt(0)}
                  </span>
                )}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-400">Facility</p>
                <p className="text-[11px] font-black text-primary-900 dark:text-white truncate max-w-[220px]">
                  {myFacility?.name || user?.facilityName}
                </p>
              </div>
            </div>
          ) : null}

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                  ${isActive 
                    ? 'text-primary-900 bg-primary-50 dark:bg-surface-800' 
                    : 'text-primary-400 hover:text-primary-900 hover:bg-primary-50/50 dark:text-primary-500 dark:hover:text-white'}
                `}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-xl transition-all ${isNotificationsOpen ? 'bg-primary-900 text-white' : 'text-primary-400 hover:text-primary-900 dark:hover:text-white'}`}
            >
              <IconBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[9px] font-black rounded-full ring-2 ring-white dark:ring-surface-900 shadow-lg animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <NotificationPopover onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4 pl-6 border-l border-primary-100 dark:border-primary-800">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-primary-900 dark:text-white uppercase leading-none mb-1">{user?.fullName}</p>
              <p className="text-[8px] font-bold text-primary-400 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
            </div>
            
            <div className="group relative">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-surface-800 border-2 border-white dark:border-primary-800 flex items-center justify-center text-primary-900 dark:text-primary-200 uppercase font-black text-sm shadow-md cursor-pointer hover:scale-105 transition-transform">
                {user?.fullName?.charAt(0)}
              </div>
              
              {/* Profile Dropdown (Simplified for now) */}
            </div>

            <button 
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="p-2.5 rounded-xl bg-primary-50 text-primary-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
              title="Terminate Session"
            >
              <IconLogout size={18} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-primary-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
        </div>
      </nav>

      <NotificationBanners />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-white dark:bg-surface-900 border-b border-primary-200 dark:border-primary-800 z-50 animate-in slide-in-from-top duration-300 shadow-2xl">
          <nav className="p-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                  ${isActive 
                    ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20' 
                    : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800'}
                `}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary-950/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-primary-100 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                 <IconLogout size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-primary-900 mb-2">Terminate Session?</h3>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest leading-relaxed mb-8">You are about to exit the secure TRMS Clinical Dashboard. Confirm withdrawal?</p>
              <div className="flex flex-col gap-3">
                 <button 
                    onClick={logout}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
                 >
                    Confirm Termination
                 </button>
                 <button 
                    onClick={() => setIsLogoutConfirmOpen(false)}
                    className="w-full py-4 bg-primary-50 text-primary-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-100 transition-all"
                 >
                    Cancel
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-screen-2xl mx-auto w-full">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                {user?.role === 'facility_admin' 
                  ? <Navigate to="/admin/departments" replace /> 
                  : user?.role === 'department_head'
                    ? <Navigate to="/department/staff" replace />
                  : <Dashboard />
                }
              </ProtectedRoute>
            } />
            <Route path="/triage" element={
              <ProtectedRoute>
                {user?.role === 'liaison_officer' ? <Navigate to="/" replace /> : <Triage />}
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
            <Route path="/admin/facilities/:id" element={
              <ProtectedRoute>
                <FacilityDetailView />
              </ProtectedRoute>
            } />
            <Route path="/admin/departments" element={
              <ProtectedRoute>
                <DepartmentManager />
              </ProtectedRoute>
            } />
            <Route path="/department/staff" element={
              <ProtectedRoute>
                <ClinicianManager />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
