import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api';
import { Referral, Department, Facility, ReferralStatus, ServiceStatus } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatBanner } from '../components/StatBanner';
import { ReferralDetailView } from '../components/ReferralDetailView';
import { AcceptModal, RejectModal, FacilitySearchModal } from '../components/LiaisonModals';
import { LiaisonSummaryCards } from '../components/LiaisonSummaryCards';
import { ServiceStatusConsole } from '../components/ServiceStatusConsole';
import {
  IconClipboardList,
  IconInbox,
  IconSend,
  IconTruck,
  IconActivity,
  IconSearch,
  IconClock,
  IconArrowRight,
  IconRefresh,
  IconX
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';

type DashboardTab = 'incoming' | 'pending_outbound' | 'sent_outbound' | 'service_status';

export default function LiaisonDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DashboardTab>('incoming');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedReferralForDetails, setSelectedReferralForDetails] = useState<Referral | null>(null);
  const [modalType, setModalType] = useState<'accept' | 'reject' | 'route' | null>(null);

  // Queries
  const { data: referrals, isLoading: isReferralsLoading } = useQuery({
    queryKey: ['liaison-referrals', activeTab === 'service_status' ? 'all' : activeTab],
    queryFn: async () => {
      // If we are on a specific tab, we can use the role filter we implemented in backend
      const roleMap: Record<string, string> = {
        'incoming': 'receiving',
        'pending_outbound': 'pending_outbound',
        'sent_outbound': 'sent_outbound'
      };

      const role = roleMap[activeTab];
      const url = role ? `/referrals?role=${role}` : '/referrals';
      const response = await apiClient.get<Referral[]>(url);
      return response.data;
    },
    enabled: activeTab !== 'service_status'
  });

  const { data: facilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['facilities-directory'],
    queryFn: async () => {
      const response = await apiClient.get<Facility[]>('/facilities');
      return response.data;
    },
    enabled: modalType === 'route' || activeTab === 'service_status'
  });

  const { data: departments } = useQuery({
    queryKey: ['facility-departments', user?.facilityId],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>(`/departments?facilityId=${user?.facilityId}`);
      return response.data;
    },
    enabled: !!user?.facilityId
  });

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: (data: { referralId: string, receivingDepartmentId: string, waitingTime?: string }) =>
      apiClient.patch(`/referrals/${data.referralId}`, {
        status: 'ACCEPTED',
        receivingDepartmentId: data.receivingDepartmentId,
        waitingTime: data.waitingTime
      }),
    onSuccess: () => {
      toast.success('Referral accepted and assigned to department.');
      queryClient.invalidateQueries({ queryKey: ['liaison-referrals'] });
      setModalType(null);
      setSelectedReferral(null);
    },
    onError: () => toast.error('Failed to accept referral.')
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { referralId: string, reason: string }) =>
      apiClient.patch(`/referrals/${data.referralId}`, {
        status: 'REJECTED',
        reason: data.reason
      }),
    onSuccess: () => {
      toast.success('Referral rejected.');
      queryClient.invalidateQueries({ queryKey: ['liaison-referrals'] });
      setModalType(null);
      setSelectedReferral(null);
    },
    onError: () => toast.error('Failed to reject referral.')
  });

  const routeMutation = useMutation({
    mutationFn: (data: { referralId: string, facilityId: string }) =>
      apiClient.post(`/referrals/${data.referralId}/route`, {
        receivingFacilityId: data.facilityId
      }),
    onSuccess: () => {
      toast.success('Referral successfully routed and request sent.');
      queryClient.invalidateQueries({ queryKey: ['liaison-referrals'] });
      setModalType(null);
    },
    onError: () => toast.error('Failed to route referral.')
  });

  const stats = [
    { label: 'Pending Inbound', value: referrals?.filter(r => activeTab === 'incoming').length || 0, trend: 'Emergency First', trendColor: 'default' as const },
    { label: 'Pending Outbound', value: referrals?.filter(r => activeTab === 'pending_outbound').length || 0, trend: 'Routing Desk', trendColor: 'warning' as const },
    { label: 'Active Tracking', value: referrals?.filter(r => activeTab === 'sent_outbound').length || 0, trend: 'Network Activity', trendColor: 'success' as const },
    { label: 'Facility Uptime', value: '100%', trend: 'Status Normal', trendColor: 'success' as const },
  ];

  const columns = [
    {
      header: 'ID / Date',
      accessor: (r: Referral) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary-400 uppercase tracking-tighter">#{r.id.slice(0, 8)}</span>
          <span className="text-[10px] font-bold text-primary-300">{new Date(r.createdAt || '').toLocaleDateString()}</span>
        </div>
      ),
      className: 'w-24'
    },
    {
      header: 'Patient / Clinical',
      accessor: (r: Referral) => (
        <div className="flex flex-col">
          <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">{r.patient?.fullName || r.patientName}</div>
          <div className="text-[10px] font-bold text-primary-500 uppercase truncate max-w-[200px]">{r.primaryDiagnosis}</div>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: (r: Referral) => (
        <Badge
          label={r.priority || 'routine'}
          variant={(r.priority === 'emergency' ? 'error' : r.priority === 'urgent' ? 'warning' : 'info') as any}
          pulse={r.priority === 'emergency'}
        />
      ),
      className: 'w-24'
    },
    {
      header: activeTab === 'incoming' ? 'Referring Node' : 'Receiving Node',
      accessor: (r: Referral) => (
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-black text-primary-900 dark:text-white uppercase tracking-tight">
            {activeTab === 'incoming' ? r.referringFacility?.name : (r.receivingFacility?.name || 'NOT ROUTED')}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (r: Referral) => (
        <Badge label={r.status || ''} variant={
          r.status === 'accepted' ? 'success' :
            r.status === 'rejected' ? 'error' :
              r.status === 'completed' ? 'success' :
                r.status === 'forwarded' ? 'info' :
                  r.status === 'pending_routing' ? 'warning' : 'info'
        } />
      )
    },
    {
      header: 'Actions',
      accessor: (r: Referral) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2" onClick={() => setSelectedReferralForDetails(r)}>
            VIEW
          </Button>
          {activeTab === 'incoming' && (r.status === 'pending' || r.status === 'forwarded') && (
            <>
              <Button size="sm" variant="primary" className="h-7 text-[10px] px-2" onClick={() => { setSelectedReferral(r); setModalType('accept'); }}>
                ACCEPT
              </Button>
              <Button size="sm" variant="danger" className="h-7 text-[10px] px-2" onClick={() => { setSelectedReferral(r); setModalType('reject'); }}>
                REJECT
              </Button>
            </>
          )}
          {activeTab === 'incoming' && r.status === 'completed' && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-[10px] px-2 border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
              onClick={() => setSelectedReferralForDetails(r)}
            >
              VIEW FEEDBACK
            </Button>
          )}
          {activeTab === 'pending_outbound' && (
            <Button size="sm" variant="warning" className="h-7 text-[10px] px-2 flex items-center gap-1" onClick={() => { setSelectedReferral(r); setModalType('route'); }}>
              ROUTE <IconArrowRight size={12} />
            </Button>
          )}
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-primary-900 dark:text-white leading-none">
            {user?.facilityName || 'Facility'} <span className="text-primary-300 font-light mx-2">|</span> Liaison Console
          </h2>
          <p className="text-xs font-bold text-primary-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Regional Entry/Exit Node Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={() => queryClient.invalidateQueries()}>
            <IconRefresh size={16} />
            Force Sync
          </Button>
        </div>
      </div>

      <LiaisonSummaryCards referrals={referrals || []} />

      {/* Ribbon Navigation */}
      <div className="flex items-center gap-1 bg-surface-50 dark:bg-surface-950 p-1 rounded-lg border border-primary-100 dark:border-primary-800 shadow-inner">
        {[
          { id: 'incoming', label: 'Incoming Referrals', icon: IconInbox, badge: referrals?.filter(r => activeTab === 'incoming').length },
          { id: 'pending_outbound', label: 'Outgoing Pending', icon: IconSend, badge: referrals?.filter(r => activeTab === 'pending_outbound').length },
          { id: 'sent_outbound', label: 'Outgoing Sent', icon: IconTruck },
          { id: 'service_status', label: 'Service Status', icon: IconActivity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DashboardTab)}
            className={`
              flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id
                ? 'bg-primary-900 text-white shadow-lg scale-[1.02]'
                : 'text-primary-400 hover:text-primary-900 dark:hover:text-white hover:bg-white dark:hover:bg-surface-900'
              }
            `}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.badge ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-white text-black' : 'bg-primary-900 text-white'}`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-lg overflow-hidden min-h-[500px] flex flex-col">
        {activeTab === 'service_status' ? (
          <ServiceStatusConsole facilityId={user?.facilityId || ''} />
        ) : (
          <DataTable
            columns={columns}
            data={referrals || []}
            isLoading={isReferralsLoading}
            emptyMessage={`No ${activeTab.replace('_', ' ')} referrals found.`}
            onRowClick={setSelectedReferralForDetails}
            pagination
          />
        )}
      </div>

      {/* Modals */}
      {modalType === 'accept' && selectedReferral && (
        <AcceptModal
          referral={selectedReferral}
          departments={departments || []}
          onClose={() => setModalType(null)}
          onAccept={(data) => acceptMutation.mutate({ referralId: selectedReferral.id, ...data })}
          isSubmitting={acceptMutation.isPending}
        />
      )}

      {modalType === 'reject' && selectedReferral && (
        <RejectModal
          referral={selectedReferral}
          onClose={() => setModalType(null)}
          onReject={(data) => rejectMutation.mutate({ referralId: selectedReferral.id, ...data })}
          isSubmitting={rejectMutation.isPending}
        />
      )}

      {modalType === 'route' && selectedReferral && (
        <FacilitySearchModal
          onClose={() => setModalType(null)}
          facilities={facilities || []}
          isLoading={isFacilitiesLoading}
          onSelect={(f) => routeMutation.mutate({ referralId: selectedReferral.id, facilityId: f.id })}
        />
      )}

      {/* Detail Modal */}
      {selectedReferralForDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-surface-50 dark:bg-surface-950 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary-400 tracking-[0.4em]">Clinical Oversight Console</span>
              <button onClick={() => setSelectedReferralForDetails(null)} className="text-primary-400 hover:text-primary-900">
                <IconX size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ReferralDetailView referral={selectedReferralForDetails} />
            </div>
            <div className="p-4 bg-primary-900 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em]">
              TRMS Regional Referral Engine v2.2
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
