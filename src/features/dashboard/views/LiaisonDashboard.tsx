import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api';
import { Referral, Department, Facility } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ReferralDetailView } from '../components/ReferralDetailView';
import { AcceptModal, RejectModal, FacilitySearchModal } from '../components/LiaisonModals';
import { ServiceStatusConsole } from '../components/ServiceStatusConsole';
import {
  IconClipboardList,
  IconInbox,
  IconSend,
  IconTruck,
  IconActivity,
  IconClock,
  IconArrowRight,
  IconRefresh,
  IconX,
  IconBuildingHospital,
  IconWaveSine,
  IconRouteSquare2,
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';

type DashboardTab =
  | 'incoming'
  | 'assigned_inbound'
  | 'completed_inbound'
  | 'pending_outbound'
  | 'sent_outbound'
  | 'service_status';

export default function LiaisonDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>('incoming');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedReferralForDetails, setSelectedReferralForDetails] = useState<Referral | null>(null);
  const [modalType, setModalType] = useState<'accept' | 'reject' | 'route' | null>(null);
  const contentRegionRef = useRef<HTMLDivElement | null>(null);
  
  // Fetch overall statistics for badges
  const { data: referralStats } = useQuery({
    queryKey: ['referrals-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refresh counts every 30s
  });

  // Queries
  const { data: referrals, isLoading: isReferralsLoading } = useQuery({
    queryKey: ['liaison-referrals', activeTab === 'service_status' ? 'all' : activeTab],
    queryFn: async () => {
      // If we are on a specific tab, we can use the role filter we implemented in backend
      const roleMap: Record<string, string> = {
        'incoming': 'receiving',
        'assigned_inbound': 'assigned_inbound',
        'completed_inbound': 'completed_inbound',
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

  // Handle deep-linking from notifications
  useEffect(() => {
    const referralId = searchParams.get('referralId');
    if (referralId && referrals && referrals.length > 0) {
      const referral = referrals.find(r => r.id === referralId);
      if (referral) {
        setSelectedReferralForDetails(referral);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, referrals, setSearchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1280) return;

    // On small screens, tab controls are above the content region.
    // Auto-scroll to the content area so users immediately see the selected tab results.
    contentRegionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [activeTab]);

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

  const tabConfig: Array<{
    id: DashboardTab;
    label: string;
    subtitle: string;
    icon: any;
    badge?: number;
  }> = [
    {
      id: 'incoming',
      label: 'Incoming',
      subtitle: 'Triage queue',
      icon: IconInbox,
      badge: referralStats?.incoming,
    },
    {
      id: 'assigned_inbound',
      label: 'Assigned',
      subtitle: 'Department handoff',
      icon: IconClipboardList,
    },
    {
      id: 'completed_inbound',
      label: 'Completed',
      subtitle: 'Closed outcomes',
      icon: IconClock,
    },
    {
      id: 'pending_outbound',
      label: 'Outbound Pending',
      subtitle: 'Needs routing',
      icon: IconSend,
      badge: referralStats?.pendingOutbound,
    },
    {
      id: 'sent_outbound',
      label: 'Outbound Sent',
      subtitle: 'Network tracking',
      icon: IconTruck,
      badge: referralStats?.sentOutbound,
    },
    {
      id: 'service_status',
      label: 'Service Matrix',
      subtitle: 'Capacity status',
      icon: IconActivity,
    },
  ];

  const activeTabMeta = tabConfig.find((tab) => tab.id === activeTab);

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
          {activeTab === 'completed_inbound' && r.status === 'completed' && (
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
    <div className="font-sans">
      <div className="rounded-3xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="bg-primary-900 text-white px-6 lg:px-8 py-6 lg:py-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10">
                <IconWaveSine size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">Liaison Control Plane</span>
              </div>
              <h2 className="mt-3 text-2xl lg:text-3xl font-black tracking-tight leading-none">
                {user?.facilityName || 'Facility'} Console
              </h2>
              <p className="mt-2 text-xs text-primary-200 uppercase tracking-[0.2em]">
                Regional Entry and Exit Referral Coordination
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold">
                <IconBuildingHospital size={14} />
                {user?.facilityName || 'Facility Node'}
              </div>
              <Button variant="secondary" size="sm" className="flex items-center gap-2 !bg-white !text-primary-900 hover:!bg-primary-100" onClick={() => queryClient.invalidateQueries()}>
                <IconRefresh size={15} />
                Force Sync
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] min-h-[640px]">
          <aside className="hidden xl:block xl:border-r border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 p-3">
            <div className="space-y-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-all
                    ${activeTab === tab.id
                      ? 'bg-primary-900 text-white border-primary-900 shadow-md'
                      : 'bg-surface-50 dark:bg-surface-950 border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:border-primary-300 dark:hover:border-primary-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <tab.icon size={16} />
                      <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                    </div>
                    {tab.badge ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-white text-primary-900' : 'bg-primary-900 text-white'}`}>
                        {tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-1 text-[10px] uppercase tracking-wider ${activeTab === tab.id ? 'text-primary-200' : 'text-primary-400'}`}>
                    {tab.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section ref={contentRegionRef} className="bg-surface-50 dark:bg-surface-950 p-4 lg:p-6 pb-28 xl:pb-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">Active View</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-primary-900 dark:text-white">
                  {activeTabMeta?.label}
                </h3>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-primary-500">
                <IconRouteSquare2 size={14} />
                <span>{activeTabMeta?.subtitle}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 overflow-hidden min-h-[500px] flex flex-col">
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
          </section>
        </div>
      </div>

      <div className="xl:hidden fixed inset-x-0 bottom-0 z-50 border-t border-primary-200 dark:border-primary-800 bg-white/95 dark:bg-surface-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-surface-900/90 px-2 py-2">
        <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar">
          {tabConfig.map((tab) => (
            <button
              key={`mobile-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                min-w-[92px] px-2 py-2 rounded-lg border text-center transition-all
                ${activeTab === tab.id
                  ? 'bg-primary-900 text-white border-primary-900'
                  : 'bg-surface-50 dark:bg-surface-950 text-primary-700 dark:text-primary-300 border-primary-100 dark:border-primary-800'}
              `}
            >
              <div className="flex items-center justify-center gap-1">
                <tab.icon size={14} />
                {tab.badge ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${activeTab === tab.id ? 'bg-white text-primary-900' : 'bg-primary-900 text-white'}`}>
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[9px] font-black uppercase tracking-tight leading-tight">
                {tab.label}
              </p>
            </button>
          ))}
        </div>
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
