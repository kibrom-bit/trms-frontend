import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api';
import { Referral } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { StatBanner } from '../components/StatBanner';
import { IconHourglassLow, IconUsersGroup, IconCircleCheck, IconTrendingUp } from '@tabler/icons-react';

export default function DepartmentHeadDashboard() {
  const { data: departmentQueue, isLoading } = useQuery({
    queryKey: ['dept-queue'],
    queryFn: async () => {
      const response = await apiClient.get<Referral[]>('/referrals');
      // In production, would filter by deptId: /referrals?dept=true
      return response.data.filter(r => r.status === 'accepted');
    }
  });

  const stats = [
    { label: 'Avg Triage TAT', value: '2.4h', trend: '-20% vs goal', trendColor: 'success' as const },
    { label: 'Total In-Dept Care', value: departmentQueue?.length || 0, trend: '4 beds free', trendColor: 'default' as const },
    { label: 'Pending Discharge', value: 3, trend: 'Due today', trendColor: 'warning' as const },
    { label: 'Staff in Shift', value: 8 },
  ];

  const columns = [
    { 
      header: 'Patient', 
      accessor: (r: Referral) => (
        <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">{r.patientName}</div>
      )
    },
    { header: 'Priority', accessor: (r: Referral) => <Badge label={r.priority || 'routine'} variant={(r.priority === 'emergency' ? 'error' : r.priority === 'urgent' ? 'warning' : 'info') as any} /> },
    { header: 'Admitted Date', accessor: (r: Referral) => new Date(r.createdAt || Date.now()).toLocaleDateString() },
    {
      header: 'Responsible Clinician',
      accessor: (r: Referral) => (
        <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{r.referringUser?.fullName || 'Unassigned'}</div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Department Command</h2>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Clinical TAT Oversight</p>
        </div>
      </div>

      <StatBanner stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-500">Wait-Time Efficiency Monitor</h3>
            <div className="flex gap-4">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-success tracking-tighter">
                    <IconCircleCheck size={12} />
                    Goal: &lt; 4h
                </div>
            </div>
        </div>
        <DataTable 
          columns={columns} 
          data={departmentQueue || []} 
          isLoading={isLoading} 
          emptyMessage="No active patients in department triage."
        />
      </div>
    </div>
  );
}
