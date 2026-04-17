import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api';
import { Referral, ReferralStatus, ReferralPriority } from '../../../types/api';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ReferralDetailView } from '../components/ReferralDetailView';
import {
  IconPlus, IconArrowUpRight, IconClock, IconCircleCheck,
  IconStethoscope, IconX, IconSend, IconAlertCircle, IconChecklist, IconHeartbeat, IconBuildingHospital
} from '@tabler/icons-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedForDischarge, setSelectedForDischarge] = useState<Referral | null>(null);
  const [selectedForDetail, setSelectedForDetail] = useState<Referral | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<Referral | null>(null);
  const [activeTab, setActiveTab] = useState<'active_patients' | 'outbound_referrals' | 'completed_cases'>('active_patients');
  const [rejectReason, setRejectReason] = useState('');
  const [dischargeForm, setDischargeForm] = useState({
    summary: '',
    finalDiagnosis: '',
    medicationsPrescribed: '',
    followUpInstructions: '',
    specialInvestigations: '',
    ongoingCareInstructions: '',
    referBackTo: '',
    dischargeDate: new Date().toISOString().split('T')[0],
  });

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['my-referrals', user?.departmentId],
    queryFn: async () => {
      // Backend uses JWT role to filter by department automatically for DOCTOR role
      const response = await apiClient.get<Referral[]>('/referrals');
      return response.data;
    },
  });

  // Handle deep-linking from notifications
  useEffect(() => {
    const referralId = searchParams.get('referralId');
    if (referralId && referrals && referrals.length > 0) {
      const referral = referrals.find(r => r.id === referralId);
      if (referral) {
        setSelectedForDetail(referral);
        // Clear param to prevent re-opening on manual refresh
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, referrals, setSearchParams]);

  // Filter 1: Referrals I initiated (Outreach) — referrals I created and sent out
  const myOutreach = referrals?.filter(r =>
    r.referringUser?.id === user?.id || r.referringUserId === user?.id
  ) || [];

  // Filter 2: Patients assigned to MY DEPARTMENT (Inbound Clinical Care)
  const myAssignments = referrals?.filter(r =>
    r.receivingDepartmentId === user?.departmentId &&
    r.status === 'accepted'
  ) || [];

  // Filter 3: Completed cases (for audit trail in the dashboard)
  const completedCases = referrals?.filter(r =>
    r.receivingDepartmentId === user?.departmentId &&
    r.status === 'completed'
  ) || [];

  const dischargeMutation = useMutation({
    mutationFn: (data: { referralId: string; payload: typeof dischargeForm }) =>
      apiClient.post(`/referrals/${data.referralId}/discharge`, data.payload),
    onSuccess: () => {
      toast.success('Discharge summary filed. The full referral chain has been notified automatically.');
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      setSelectedForDischarge(null);
      setDischargeForm({
        summary: '',
        finalDiagnosis: '',
        medicationsPrescribed: '',
        followUpInstructions: '',
        specialInvestigations: '',
        ongoingCareInstructions: '',
        referBackTo: '',
        dischargeDate: new Date().toISOString().split('T')[0],
      });
    },
    onError: () => toast.error('Failed to submit discharge summary. Please try again.'),
  });

  const clinicianAcceptMutation = useMutation({
    mutationFn: (referralId: string) => apiClient.patch(`/referrals/${referralId}/clinician-accept`),
    onSuccess: () => {
      toast.success('Referral claimed successfully. Notifications sent.');
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
    },
    onError: () => toast.error('Failed to claim referral. Please try again.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { referralId: string; payload: { status: string; reason: string } }) =>
      apiClient.patch(`/referrals/${data.referralId}`, data.payload),
    onSuccess: () => {
      toast.success('Referral rejected. Notifications sent.');
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      setSelectedForReject(null);
      setRejectReason('');
    },
    onError: () => toast.error('Failed to reject referral. Please try again.'),
  });

  const handleDischargeSubmit = () => {
    if (!selectedForDischarge) return;
    if (!dischargeForm.finalDiagnosis.trim() || !dischargeForm.summary.trim() || !dischargeForm.medicationsPrescribed.trim() || !dischargeForm.followUpInstructions.trim()) {
      toast.error('Clinical Summary, Final Diagnosis, Medications, and Follow-up are required.');
      return;
    }
    dischargeMutation.mutate({ referralId: selectedForDischarge.id, payload: dischargeForm });
  };

  const columnsBase = [
    {
      header: 'Patient',
      accessor: (r: Referral) => (
        <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">
          {r.patient?.fullName || r.patientName}
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: (r: Referral) => <Badge label={r.priority || 'routine'} variant={(r.priority === 'emergency' ? 'error' : r.priority === 'urgent' ? 'warning' : 'info') as any} />,
      className: 'w-24'
    },
    {
      header: 'Status',
      accessor: (r: Referral) => <Badge label={r.status || 'pending'} variant={(r.status === 'accepted' ? 'success' : r.status === 'rejected' ? 'error' : r.status === 'completed' ? 'success' : 'warning') as any} />,
      className: 'w-24'
    },
  ];

  const assignmentColumns = [
    ...columnsBase,
    {
      header: 'From Facility',
      accessor: (r: Referral) => (
        <div className="text-xs font-bold text-primary-500 uppercase">{r.referringFacility?.name || 'Unknown'}</div>
      )
    },
    {
      header: 'Action',
      accessor: (r: Referral) => (
        <div className="flex gap-2">
          {r.clinicianAcceptedAt ? (
            <Button size="sm" variant="primary" className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); setSelectedForDischarge(r); }}>
              DISCHARGE
            </Button>
          ) : (
            <>
              <Button size="sm" variant="primary" className="h-7 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); clinicianAcceptMutation.mutate(r.id); }} isLoading={clinicianAcceptMutation.isPending}>
                CLAIM
              </Button>
              <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2 text-error hover:bg-red-50 hover:border-red-200" onClick={(e) => { e.stopPropagation(); setSelectedForReject(r); }}>
                REJECT
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); setSelectedForDetail(r); }}>
            VIEW
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  const tabConfig = [
    { id: 'active_patients' as const, label: 'Active Patients', icon: IconStethoscope, count: myAssignments.length },
    { id: 'outbound_referrals' as const, label: 'Outbound Referrals', icon: IconArrowUpRight, count: myOutreach.length },
    { id: 'completed_cases' as const, label: 'Completed Cases', icon: IconCircleCheck, count: completedCases.length },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-3xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 shadow-[0_22px_70px_-35px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="bg-primary-900 text-white p-5 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10">
                <IconHeartbeat size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">Clinical Department Workspace</span>
              </div>
              <h2 className="mt-3 text-2xl lg:text-3xl font-black tracking-tight leading-none">
                {user?.departmentName || 'Medical Department'}
              </h2>
              <p className="mt-2 text-xs text-primary-200 uppercase tracking-[0.2em]">
                {user?.fullName || 'Practitioner'} · {user?.facilityName || 'Facility'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold">
                <IconBuildingHospital size={14} />
                {user?.facilityName || 'Facility Node'}
              </div>
              <Link to="/referrals/new">
                <Button variant="secondary" className="flex items-center gap-2 !bg-white !text-primary-900 hover:!bg-primary-100">
                  <IconPlus size={16} />
                  New Referral
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-surface-50 dark:bg-surface-950 border-t border-primary-100/60 dark:border-primary-800/70">
          <div className="rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 p-2">
            <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    min-w-[180px] flex-1 px-3 py-2 rounded-xl border transition-all text-left
                    ${activeTab === tab.id
                      ? 'bg-primary-900 text-white border-primary-900 shadow'
                      : 'bg-surface-50 dark:bg-surface-950 text-primary-700 dark:text-primary-300 border-primary-100 dark:border-primary-800'}
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <tab.icon size={15} />
                      <span className="text-[11px] font-black uppercase tracking-wide">{tab.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white text-primary-900' : 'bg-primary-900 text-white'}`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'active_patients' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <IconStethoscope size={16} className="text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-900 dark:text-white">
              Active Patients - My Department
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl overflow-hidden shadow-sm">
            <DataTable
              columns={assignmentColumns}
              data={myAssignments}
              isLoading={isLoading}
              emptyMessage="No active patients assigned to your department."
            />
          </div>
        </div>
      )}

      {activeTab === 'outbound_referrals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <IconArrowUpRight size={16} className="text-primary-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-900 dark:text-white">
              My Outbound Referrals
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl overflow-hidden shadow-sm">
            <DataTable
              columns={columnsBase}
              data={myOutreach.slice(0, 6)}
              isLoading={isLoading}
              emptyMessage="No outbound referrals submitted."
              onRowClick={setSelectedForDetail}
            />
          </div>
        </div>
      )}

      {activeTab === 'completed_cases' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-surface-900 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconCircleCheck size={16} className="text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-600">
                Completed Cases - Feedback Dispatched
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary-500">
              <IconChecklist size={14} />
              {completedCases.length} archived records
            </div>
          </div>
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl overflow-hidden shadow-sm">
            <DataTable
              columns={columnsBase}
              data={completedCases.slice(0, 5)}
              isLoading={isLoading}
              emptyMessage="No completed cases yet."
              onRowClick={setSelectedForDetail}
            />
          </div>
        </div>
      )}

      {/* ─── Discharge Modal ──────────────────────────────────────────────── */}
      {selectedForDischarge && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="p-5 border-b border-primary-100 dark:border-primary-800 bg-emerald-50 dark:bg-emerald-950/20 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">Referral Feedback (Discharge Summary)</p>
                <h3 className="text-lg font-black uppercase tracking-tight text-primary-900 dark:text-white">
                  {selectedForDischarge.patient?.fullName || selectedForDischarge.patientName}
                </h3>
                <p className="text-xs font-bold text-primary-400 mt-1">
                  Ref #{selectedForDischarge.id.slice(0, 8).toUpperCase()} · {selectedForDischarge.primaryDiagnosis}
                </p>
              </div>
              <button onClick={() => setSelectedForDischarge(null)} className="text-primary-400 hover:text-primary-900 mt-1">
                <IconX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-primary-100">
              {/* Info Banner */}
              <div className="mb-6">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                  <IconAlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-wide">
                    FEEDBACK LOOP: This summary will automatically notify the referring clinician and both facility liaison officers. This completes the national two-way referral requirement.
                  </p>
                </div>
              </div>

              {/* Form Sections */}
              <div className="space-y-6">
                {/* section: Clinical Basics */}
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-300 border-b border-primary-50 dark:border-primary-800 pb-1">Clinical Summary (Mandatory)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">Discharge Date</label>
                      <input
                        type="date"
                        className="input-field text-sm font-bold w-full"
                        value={dischargeForm.dischargeDate}
                        onChange={e => setDischargeForm(f => ({ ...f, dischargeDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">Final Diagnosis <span className="text-error">*</span></label>
                      <input
                        className="input-field text-sm font-bold w-full"
                        placeholder="Confirmed diagnosis..."
                        value={dischargeForm.finalDiagnosis}
                        onChange={e => setDischargeForm(f => ({ ...f, finalDiagnosis: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">
                      Summary of Treatment Provided <span className="text-error">*</span>
                    </label>
                    <textarea
                      className="input-field text-sm w-full min-h-[80px] resize-none"
                      placeholder="Narrative of care given (e.g., surgery, medication)..."
                      value={dischargeForm.summary}
                      onChange={e => setDischargeForm(f => ({ ...f, summary: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">
                        Medications Prescribed <span className="text-error">*</span>
                      </label>
                      <textarea
                        className="input-field text-sm w-full min-h-[70px] resize-none"
                        placeholder="List of medicines, dosage, and duration..."
                        value={dischargeForm.medicationsPrescribed}
                        onChange={e => setDischargeForm(f => ({ ...f, medicationsPrescribed: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">
                        Follow-up Instructions <span className="text-error">*</span>
                      </label>
                      <textarea
                        className="input-field text-sm w-full min-h-[70px] resize-none"
                        placeholder="When/where the patient should return..."
                        value={dischargeForm.followUpInstructions}
                        onChange={e => setDischargeForm(f => ({ ...f, followUpInstructions: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* section: Recommendations */}
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-300 border-b border-primary-50 dark:border-primary-800 pb-1">Additional Recommendations (Optional)</h4>
                  
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">Special Investigations performed</label>
                    <textarea
                      className="input-field text-sm w-full min-h-[60px] resize-none"
                      placeholder="Lab results, imaging findings, etc..."
                      value={dischargeForm.specialInvestigations}
                      onChange={e => setDischargeForm(f => ({ ...f, specialInvestigations: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">Ongoing Medication/Care Needs</label>
                    <textarea
                      className="input-field text-sm w-full min-h-[60px] resize-none"
                      placeholder="Specific instructions for the referring clinician..."
                      value={dischargeForm.ongoingCareInstructions}
                      onChange={e => setDischargeForm(f => ({ ...f, ongoingCareInstructions: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1.5 block">Refer Back To</label>
                    <input
                      className="input-field text-sm font-medium w-full"
                      placeholder="Specific clinician or department (optional)..."
                      value={dischargeForm.referBackTo}
                      onChange={e => setDischargeForm(f => ({ ...f, referBackTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedForDischarge(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                onClick={handleDischargeSubmit}
                isLoading={dischargeMutation.isPending}
              >
                <IconSend size={14} />
                Submit & Notify Chain
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail View Modal ────────────────────────────────────────────── */}
      {selectedForDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-surface-50 dark:bg-surface-950 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary-400 tracking-[0.4em]">Clinical Record</span>
              <button onClick={() => setSelectedForDetail(null)} className="text-primary-400 hover:text-primary-900">
                <IconX size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ReferralDetailView referral={selectedForDetail} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ────────────────────────────────────────────── */}
      {selectedForReject && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
           <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
             <div className="p-4 border-b border-primary-100 dark:border-primary-800 flex items-center justify-between">
               <h3 className="text-lg font-black uppercase text-error">Reject Referral</h3>
               <button onClick={() => setSelectedForReject(null)} className="text-primary-400 hover:text-primary-900">
                 <IconX size={24} />
               </button>
             </div>
             <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-primary-500 mb-2 block">
                    Reason for Rejection <span className="text-error">*</span>
                  </label>
                  <textarea
                    className="input-field text-sm w-full min-h-[100px] resize-none"
                    placeholder="Provide a clear clinical reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
             </div>
             <div className="p-4 border-t border-primary-100 dark:border-primary-800 flex gap-3">
               <Button variant="secondary" className="flex-1" onClick={() => setSelectedForReject(null)}>Cancel</Button>
               <Button 
                variant="primary" 
                className="flex-1 bg-error hover:bg-red-700 text-white" 
                isLoading={rejectMutation.isPending}
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('Reason is required');
                    return;
                  }
                  rejectMutation.mutate({ referralId: selectedForReject.id, payload: { status: 'REJECTED', reason: rejectReason } });
                }}
              >
                 Confirm Rejection
               </Button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
