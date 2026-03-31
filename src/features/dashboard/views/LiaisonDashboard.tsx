import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api';
import { Referral } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatBanner } from '../components/StatBanner';
import { IconClipboardList } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function LiaisonDashboard() {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['liaison-referrals'],
    queryFn: async () => {
      const response = await apiClient.get<Referral[]>('/referrals');
      return response.data;
    },
  });

  // Filter 1: Inbound Triage (Coming TO my facility)
  const inbound = referrals?.filter(r => r.receivingFacility?.id === user?.facilityId && r.status === 'pending') || [];
  
  // Filter 2: Outbound Routing (Sent BY my doctors, I need to route them)
  const outbound = referrals?.filter(r => r.referringFacility?.id === user?.facilityId && r.status === 'pending') || [];

  const stats = [
    { label: 'Inbound In-Triage', value: inbound.length, trend: 'High Priority First', trendColor: 'default' as const },
    { label: 'Outbound Awaiting Routing', value: outbound.length, trend: 'Search Facilities', trendColor: 'warning' as const },
    { label: 'Avg Triage Time', value: '14m', trend: 'Network Lead', trendColor: 'success' as const },
    { label: 'Referrals Managed (Today)', value: 24 },
  ];

  const columns = [
    { 
      header: 'Patient', 
      accessor: (r: Referral) => (
        <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">{r.patientName}</div>
      )
    },
    { 
      header: 'Priority', 
      accessor: (r: Referral) => <Badge label={r.priority || 'routine'} variant={(r.priority === 'emergency' ? 'error' : r.priority === 'urgent' ? 'warning' : 'info') as any} />,
    },
    { 
      header: 'Origin/Dest', 
      accessor: (r: Referral) => (
        <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
            {r.referringFacility?.id === user?.facilityId ? 'To: ' + (r.receivingFacility?.name || 'Search...') : 'From: ' + (r.referringFacility?.name || 'Unknown')}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Liaison Command</h2>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Managing facility entry & exit flows</p>
        </div>
        <Link to="/triage">
          <Button variant="primary" className="flex items-center gap-2">
            <IconClipboardList size={16} />
            Command Triage Queue
          </Button>
        </Link>
      </div>

      <StatBanner stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
            Inbound Facility Triage
          </h3>
          <DataTable 
            columns={columns} 
            data={inbound.slice(0, 5)} 
            isLoading={isLoading} 
            emptyMessage="No pending inbound triage requests."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-500">
            Outbound Routing Desk
          </h3>
          <DataTable 
            columns={columns} 
            data={outbound.slice(0, 5)} 
            isLoading={isLoading} 
            emptyMessage="No outbound clinical requests awaiting routing."
          />
        </div>
      </div>
    </div>
  );
}
