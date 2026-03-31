import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Referral, ReferralPriority, ReferralStatus } from '../../types/api';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  IconAlertCircle, 
  IconCheck, 
  IconX, 
  IconArrowsRight, 
  IconInfoCircle,
  IconClock
} from '@tabler/icons-react';

export default function Triage() {
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | 'all'>('pending');
  const [showForward, setShowForward] = useState(false);
  const [forwardFacilityId, setForwardFacilityId] = useState('');
  const [dischargeData, setDischargeData] = useState({
    summary: '',
    finalDiagnosis: '',
    followUpInstructions: ''
  });

  const { data: referrals, isLoading, error } = useQuery({
    queryKey: ['referrals', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await apiClient.get<Referral[]>('/referrals', { params });
      return response.data;
    },
  });

  const [selectedDeptId, setSelectedDeptId] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/departments');
      return response.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/referrals/${id}`, { 
      status: 'accepted',
      departmentId: selectedDeptId 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
      setSelectedDeptId('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/referrals/${id}`, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
    },
  });

  const forwardMutation = useMutation({
    mutationFn: ({ id, facilityId }: { id: string; facilityId: string }) => 
      apiClient.patch(`/referrals/${id}`, { status: 'forwarded', forwardedToId: facilityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/referrals/${id}/discharge`, dischargeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/facilities');
      return response.data;
    },
  });

  const priorityBadge = (priority: ReferralPriority) => {
    switch (priority) {
      case 'emergency': return <Badge label="Emergency" variant="error" />;
      case 'urgent': return <Badge label="Urgent" variant="warning" />;
      case 'routine': return <Badge label="Routine" variant="info" />;
      default: return <Badge label={priority} />;
    }
  };

  const statusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'pending': return <Badge label="Pending" variant="warning" />;
      case 'accepted': return <Badge label="Accepted" variant="success" />;
      case 'rejected': return <Badge label="Rejected" variant="error" />;
      case 'forwarded': return <Badge label="Forwarded" variant="info" />;
      case 'completed': return <Badge label="Completed" variant="success" />;
      default: return <Badge label={status} />;
    }
  };

  const columns = [
    { 
      header: 'Priority', 
      accessor: (r: Referral) => priorityBadge(r.priority || 'routine' as ReferralPriority),
      className: 'w-24'
    },
    { 
      header: 'Patient', 
      accessor: (r: Referral) => (
        <div>
          <div className="font-bold uppercase tracking-tight">{r.patientName}</div>
          <div className="text-[10px] text-primary-400 font-medium">DOB: {r.patientDob}</div>
        </div>
      )
    },
    { 
      header: 'Origin', 
      accessor: (r: Referral) => (
        <div className="text-xs font-medium uppercase">{r.referringFacility?.name || 'Unknown'}</div>
      )
    },
    { 
      header: 'Status', 
      accessor: (r: Referral) => statusBadge(r.status || 'pending' as ReferralStatus),
      className: 'w-24'
    },
    { 
      header: 'Updates', 
      accessor: (r: Referral) => (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400">
          <IconClock size={12} />
          {r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        </div>
      ),
      className: 'w-32'
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">
            Referral Triage
          </h1>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
            Clinical inbound & outbound routing
          </p>
        </div>

        <div className="flex gap-2">
          {(['pending', 'accepted', 'rejected', 'completed', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${
                filterStatus === status 
                ? 'bg-primary-900 border-primary-900 text-white dark:bg-primary-800' 
                : 'bg-transparent border-primary-200 text-primary-500 hover:border-primary-400 dark:border-primary-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded flex items-center gap-3 text-error">
              <IconAlertCircle size={20} />
              <span className="text-sm font-bold uppercase tracking-tight">Failed to fetch referrals.</span>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <DataTable 
              columns={columns} 
              data={referrals || []} 
              isLoading={isLoading} 
              onRowClick={(r) => { 
                setSelectedReferral(r); 
                setShowForward(false);
              }}
              emptyMessage={`No ${filterStatus} referrals found.`}
            />
          </div>
        </div>

        {/* Clinical Detail Panel */}
        {selectedReferral && (
          <div className="w-96 flex flex-col bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-lg overflow-hidden animate-slide-in">
            <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-900 dark:text-white font-black uppercase tracking-tight text-sm">
                <IconInfoCircle size={18} />
                Case Management
              </div>
              <button 
                onClick={() => setSelectedReferral(null)}
                className="text-primary-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">Patient Information</h4>
                  <p className="text-base font-black text-primary-900 dark:text-white uppercase leading-tight">
                    {selectedReferral.patientName}
                  </p>
                  <p className="text-xs text-primary-500 font-bold">
                    DOB: {selectedReferral.patientDob} · {selectedReferral.patientGender?.toUpperCase()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary-50 dark:border-primary-800">
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Priority</h4>
                    {priorityBadge(selectedReferral.priority || 'routine' as ReferralPriority)}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Current Status</h4>
                    {statusBadge(selectedReferral.status || 'pending' as ReferralStatus)}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary-50 dark:border-primary-800">
                <div>
                  <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">Primary Diagnosis</h4>
                  <p className="text-xs font-bold text-primary-800 dark:text-primary-200 leading-relaxed italic">
                    "{selectedReferral.primaryDiagnosis || 'N/A'}"
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">Clinical Summary</h4>
                  <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
                    {selectedReferral.clinicalSummary || 'No clinical summary provided.'}
                  </p>
                </div>
              </div>

              {/* Action specific sections */}
              {selectedReferral.status === 'accepted' && (
                <div className="space-y-4 pt-6 border-t border-primary-100 dark:border-primary-800">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Finalize Case / Discharge</h4>
                  <div className="space-y-3">
                    <input 
                      className="input-field text-xs h-9 font-bold uppercase" 
                      placeholder="Final Diagnosis"
                      value={dischargeData.finalDiagnosis}
                      onChange={e => setDischargeData({...dischargeData, finalDiagnosis: e.target.value})}
                    />
                    <textarea 
                      className="input-field text-xs p-2 min-h-[60px]" 
                      placeholder="Discharge Summary"
                      value={dischargeData.summary}
                      onChange={e => setDischargeData({...dischargeData, summary: e.target.value})}
                    />
                    <textarea 
                      className="input-field text-xs p-2 min-h-[60px]" 
                      placeholder="Follow-up Instructions"
                      value={dischargeData.followUpInstructions}
                      onChange={e => setDischargeData({...dischargeData, followUpInstructions: e.target.value})}
                    />
                    <Button 
                      variant="primary" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => dischargeMutation.mutate(selectedReferral.id)}
                      isLoading={dischargeMutation.isPending}
                    >
                      <IconCheck size={14} /> Submit Discharge summary
                    </Button>
                  </div>
                </div>
              )}

              {showForward && (
                <div className="space-y-4 pt-6 border-t border-primary-100 dark:border-primary-800 animate-slide-in">
                  <h4 className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Select Forwarding Facility</h4>
                  <select 
                    className="input-field text-xs h-10 font-bold uppercase"
                    value={forwardFacilityId}
                    onChange={e => setForwardFacilityId(e.target.value)}
                  >
                    <option value="">Select Target...</option>
                    {facilities?.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <Button 
                    variant="primary" 
                    className="w-full text-white"
                    onClick={() => forwardMutation.mutate({ id: selectedReferral.id, facilityId: forwardFacilityId })}
                    isLoading={forwardMutation.isPending}
                    disabled={!forwardFacilityId}
                  >
                    Confirm Forwarding
                  </Button>
                </div>
              )}
            </div>

            {selectedReferral.status === 'pending' && !showForward && (
              <div className="p-4 border-t border-primary-100 dark:border-primary-800 space-y-3 bg-surface-50 dark:bg-surface-950">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-primary-400 tracking-widest">Assign to Department</label>
                  <select 
                    className="input-field text-xs h-9 font-bold uppercase w-full"
                    value={selectedDeptId}
                    onChange={e => setSelectedDeptId(e.target.value)}
                  >
                    <option value="">Select Dept...</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="primary" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => acceptMutation.mutate(selectedReferral.id)}
                    isLoading={acceptMutation.isPending}
                    disabled={!selectedDeptId}
                  >
                    <IconCheck size={14} /> Accept & Route
                  </Button>
                  <Button 
                    variant="danger"
                    className="text-white"
                    onClick={() => rejectMutation.mutate(selectedReferral.id)}
                    isLoading={rejectMutation.isPending}
                  >
                    <IconX size={14} /> Reject
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="col-span-2"
                    onClick={() => setShowForward(true)}
                  >
                    <IconArrowsRight size={14} /> Forward to Other Facility
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
