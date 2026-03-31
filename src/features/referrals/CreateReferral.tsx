import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { CreateReferralRequest, Facility, ReferralPriority, PatientGender } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { IconSend, IconArrowLeft, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function CreateReferral() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<CreateReferralRequest>({
    patientName: '',
    patientDob: '',
    patientGender: 'unknown',
    patientPhone: '',
    receivingFacilityId: '',
    priority: 'routine',
    clinicalSummary: '',
    primaryDiagnosis: '',
    treatmentGiven: '',
    reason: '',
    consentGiven: true,
  });

  // Fetch facilities for the dropdown
  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await apiClient.get<Facility[]>('/facilities');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateReferralRequest) => apiClient.post('/referrals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit referral. Please check all fields.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const inputCls = "input-field text-xs font-bold uppercase tracking-widest h-10";
  const labelCls = "block text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto py-6 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-primary-50 dark:hover:bg-surface-900 rounded text-primary-400 transition-colors"
        >
          <IconArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">
            Initiate Clinical Referral
          </h1>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
            Standard Operating Procedure (SOP) Form
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-24">
        {/* Patient Identification */}
        <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-sm">
          <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800">
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">1. Patient Identification</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className={labelCls}>Full Name (As per identification)</label>
              <input 
                type="text" 
                required 
                className={inputCls}
                value={form.patientName}
                onChange={e => setForm({...form, patientName: e.target.value})}
              />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input 
                type="date" 
                required 
                className={inputCls}
                value={form.patientDob}
                onChange={e => setForm({...form, patientDob: e.target.value})}
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select 
                className={inputCls}
                value={form.patientGender}
                onChange={e => setForm({...form, patientGender: e.target.value as PatientGender})}
              >
                <option value="male">MALE</option>
                <option value="female">FEMALE</option>
                <option value="other">OTHER</option>
                <option value="unknown">UNKNOWN</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone Contact (Optional)</label>
              <input 
                type="text" 
                className={inputCls}
                value={form.patientPhone}
                onChange={e => setForm({...form, patientPhone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-sm">
          <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800">
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">2. Clinical Summary & Diagnosis</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className={labelCls}>Primary Diagnosis / Working Impression</label>
              <input 
                type="text" 
                required 
                className={inputCls}
                value={form.primaryDiagnosis}
                onChange={e => setForm({...form, primaryDiagnosis: e.target.value})}
              />
            </div>
            <div>
              <label className={labelCls}>Clinical Presentation & History</label>
              <textarea 
                required 
                rows={4}
                className="input-field text-xs font-medium p-3"
                value={form.clinicalSummary}
                onChange={e => setForm({...form, clinicalSummary: e.target.value})}
              />
            </div>
            <div>
              <label className={labelCls}>Treatment Administered at Origin</label>
              <textarea 
                rows={3}
                className="input-field text-xs font-medium p-3 italic"
                placeholder="Medications, procedures, interventions..."
                value={form.treatmentGiven}
                onChange={e => setForm({...form, treatmentGiven: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Transfer Logistics */}
        <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-sm">
          <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800">
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">3. Internal Routing & Preferred Destination</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Preferred Receiving Facility</label>
              <select 
                required 
                className={inputCls}
                value={form.receivingFacilityId}
                onChange={e => setForm({...form, receivingFacilityId: e.target.value})}
              >
                <option value="">SELECT PREFERENCE...</option>
                {facilities?.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-primary-400 font-bold uppercase mt-2 italic">* Selection will be reviewed and routed by your Facility Liaison Officer.</p>
            </div>
            <div>
              <label className={labelCls}>Urgency Level</label>
              <select 
                required 
                className={inputCls}
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value as ReferralPriority})}
              >
                <option value="routine">ROUTINE (Standard Queue)</option>
                <option value="urgent">URGENT (24h Window)</option>
                <option value="emergency">EMERGENCY (Immediate Action)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Reason for Referral</label>
              <input 
                type="text" 
                required 
                className={inputCls}
                placeholder="e.g. Higher level of care / Specialized surgery"
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 text-error rounded shadow-sm">
            <IconAlertCircle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-primary-100 dark:border-primary-800">
           <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
             Cancel & Discard
           </Button>
           <Button variant="primary" type="submit" isLoading={mutation.isPending} className="px-8">
             <IconSend size={16} /> Finalize & Submit Referral
           </Button>
        </div>
      </form>
    </div>
  );
}
