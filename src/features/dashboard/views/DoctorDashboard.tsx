import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api';
import { Referral, ReferralStatus, ReferralPriority } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatBanner } from '../components/StatBanner';
import { IconPlus, IconArrowUpRight, IconClock, IconCircleCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => {
      const response = await apiClient.get<Referral[]>('/referrals');
      return response.data;
    },
  });

  // Filter 1: Referrals I initiated (Outreach)
  const myOutreach = referrals?.filter(r => r.referringUser?.id === user?.id) || [];
  
  // Filter 2: Patients assigned to my facility/dept (Inbound Clinical Care)
  const myAssignments = referrals?.filter(r => 
    r.receivingFacility?.id === user?.facilityId && 
    r.status === 'accepted'
  ) || [];

  const stats = [
    { label: 'My Pending Submissions', value: myOutreach.filter(r => r.status === 'pending').length, trend: 'Awaiting Liaison Routing', trendColor: 'warning' as const },
    { label: 'Current In-Dept Care', value: myAssignments.length, trend: 'Active Patients', trendColor: 'success' as const },
    { label: 'TAT Feedback', value: '3.1h', trend: 'Liaison Efficiency', trendColor: 'success' as const },
    { label: 'Discharges (MTD)', value: 8 },
  ];

  const columnsBase = [
    { 
      header: 'Patient', 
      accessor: (r: Referral) => (
        <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">{r.patientName}</div>
      )
    },
    { 
      header: 'Priority', 
      accessor: (r: Referral) => <Badge label={r.priority || 'routine'} variant={(r.priority === 'emergency' ? 'error' : r.priority === 'urgent' ? 'warning' : 'info') as any} />,
      className: 'w-24'
    },
    { 
      header: 'Status', 
      accessor: (r: Referral) => <Badge label={r.status || 'pending'} variant={(r.status === 'accepted' ? 'success' : r.status === 'rejected' ? 'error' : 'warning') as any} />,
      className: 'w-24'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Clinical Command</h2>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Managing my patient referral lifecycle</p>
        </div>
        <Link to="/referrals/new">
          <Button variant="primary" className="flex items-center gap-2 text-white">
            <IconPlus size={16} />
            Clinical Referral Intake
          </Button>
        </Link>
      </div>

      <StatBanner stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-500">My Outbound Outreach</h3>
          <DataTable 
            columns={columnsBase} 
            data={myOutreach.slice(0, 5)} 
            isLoading={isLoading} 
            emptyMessage="No pending outbound requests submitted to Liaison."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-500">Incoming Patients (My Care)</h3>
          <DataTable 
            columns={columnsBase} 
            data={myAssignments.slice(0, 5)} 
            isLoading={isLoading} 
            emptyMessage="No incoming patients assigned by Liaison yet."
          />
        </div>
      </div>
    </div>
  );
}
