import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { StatBanner } from '../components/StatBanner';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { IconBuildingHospital, IconUsers, IconActivity, IconAlertTriangle } from '@tabler/icons-react';

export default function FacilityAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['facility-admin-stats'],
    queryFn: async () => {
      // Mocked for dashboard utility display
      return {
        totalStaff: 42,
        activeReferrals: 15,
        serviceAlerts: 2,
        deptLoad: [
          { name: 'Emergency', load: 'High', count: 12 },
          { name: 'Internal Medicine', load: 'Normal', count: 8 },
          { name: 'Pediatrics', load: 'Low', count: 4 },
          { name: 'Surgery', load: 'Normal', count: 6 },
        ]
      };
    }
  });

  const bannerStats = [
    { label: 'Facility Referral Load', value: stats?.activeReferrals || 0, trend: 'Moderate', trendColor: 'warning' as const },
    { label: 'Clinical Staff Online', value: stats?.totalStaff || 0, trend: '98% shift cover', trendColor: 'success' as const },
    { label: 'Critical Service Alerts', value: stats?.serviceAlerts || 0, trend: 'Check Directory', trendColor: 'error' as const },
    { label: 'Network Wait Time', value: '1.2h', trend: 'Regional Avg', trendColor: 'default' as const },
  ];

  const columns = [
    { header: 'Department', accessor: 'name' },
    { 
      header: 'Status', 
      accessor: (d: any) => {
        const variant = d.load === 'High' ? 'error' : d.load === 'Normal' ? 'success' : 'info';
        return <Badge label={d.load} variant={variant} />;
      }
    },
    { header: 'Patient Count', accessor: 'count', className: 'text-right' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Facility Command</h2>
          <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Oversight & Resource Management</p>
        </div>
        <div className="flex gap-2">
            <div className="px-3 py-1 bg-error-50 border border-error-100 rounded text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-2">
                <IconAlertTriangle size={14} />
                2 Services Limited
            </div>
        </div>
      </div>

      <StatBanner stats={bannerStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-900">Departmental Load Monitor</h3>
          <DataTable 
            columns={columns} 
            data={stats?.deptLoad || []} 
            isLoading={isLoading} 
          />
        </div>

        <div className="p-8 border border-primary-100 dark:border-primary-800 rounded-[2rem] bg-white dark:bg-surface-900 space-y-4 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-900 mb-6">Quick Governance Actions</h3>
            <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/departments" className="p-6 border border-primary-100 dark:border-primary-800 rounded-3xl hover:bg-primary-50 dark:hover:bg-surface-800 transition-all hover:shadow-lg group text-left block">
                    <IconBuildingHospital className="text-primary-900 mb-3 group-hover:scale-110 transition-transform" size={28} />
                    <p className="text-xs font-black text-primary-900 dark:text-white uppercase tracking-tight">Internal Units</p>
                    <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mt-1">Provision & Manage Departments</p>
                </Link>
                <div className="p-6 border border-primary-100 dark:border-primary-800 rounded-3xl opacity-40 bg-primary-50/10 cursor-not-allowed">
                    <IconActivity className="text-primary-400 mb-3" size={28} />
                    <p className="text-xs font-black text-primary-900 dark:text-white uppercase tracking-tight">Capabilities</p>
                    <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mt-1">Service Status (Planned)</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
