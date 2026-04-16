import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { 
  IconSend, 
  IconArrowLeft, 
  IconAlertCircle, 
  IconUser, 
  IconStethoscope, 
  IconTruck,
  IconCheck
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CreateReferral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<CreateReferralRequest>({
    patientName: '',
    patientDob: '',
    mrn: '',
    patientGender: 'unknown',
    patientPhone: '',
    receivingFacilityId: '',
    serviceType: '',
    priority: 'routine',
    clinicalSummary: '',
    primaryDiagnosis: '',
    otherDiagnoses: '',
    treatmentGiven: '',
    reason: '',
    consentGiven: true,
    allergies: '',
    pastMedicalHistory: '',
    currentMedications: '',
    vitalSigns: '',
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
    mutationFn: (data: CreateReferralRequest) => {
      // Clean up empty optional fields
      const payload = { ...data };
      if (!payload.receivingFacilityId) delete payload.receivingFacilityId;
      if (!payload.serviceType) delete payload.serviceType;
      return apiClient.post('/referrals', payload);
    },
    onSuccess: () => {
      toast.success('Referral successfully submitted to Liaison routing dashboard.');
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit referral. Please check all mandatory fields.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentGiven) {
      setError('Patient consent confirmation is mandatory.');
      return;
    }
    mutation.mutate(form);
  };

  const inputCls = "input-field text-xs font-bold uppercase tracking-widest h-11";
  const areaCls = "input-field text-xs font-medium p-3 min-h-[100px]";
  const labelCls = "block text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2";
  const sectionCls = "bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-xl shadow-sm overflow-hidden mb-8";
  const sectionHeaderCls = "px-6 py-4 bg-primary-50 dark:bg-surface-800 border-b border-primary-100 dark:border-primary-800 flex items-center gap-3";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 font-sans animate-fade-in">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 hover:bg-primary-50 dark:hover:bg-surface-800 rounded-full text-primary-400 transition-all active:scale-95"
        >
          <IconArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-primary-900 dark:text-white leading-none">
            New Clinical Referral
          </h1>
          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.3em] mt-2">
            Regional Standardized Referral Protocol (TRMS v2.2)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pb-24">
        {/* Section 1: Patient Details */}
        <div className={sectionCls}>
          <div className={sectionHeaderCls}>
            <div className="p-2 bg-white dark:bg-surface-900 rounded-lg text-primary-600 shadow-sm">
              <IconUser size={18} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">1. Patient Identification & Demographics</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <label className={labelCls}>Full Legal Name <span className="text-error">*</span></label>
              <input type="text" required className={inputCls} value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>Medical Record Number (MRN)</label>
              <input type="text" className={inputCls} placeholder="Facility specific ID" value={form.mrn || ''} onChange={e => setForm({...form, mrn: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>Date of Birth <span className="text-error">*</span></label>
              <input type="date" required className={inputCls} value={form.patientDob} onChange={e => setForm({...form, patientDob: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>Biological Gender <span className="text-error">*</span></label>
              <select className={inputCls} value={form.patientGender} onChange={e => setForm({...form, patientGender: e.target.value as PatientGender})}>
                <option value="male">MALE</option>
                <option value="female">FEMALE</option>
                <option value="other">OTHER</option>
                <option value="unknown">UNKNOWN</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Primary Phone Contact</label>
              <input type="text" className={inputCls} value={form.patientPhone || ''} onChange={e => setForm({...form, patientPhone: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Data */}
        <div className={sectionCls}>
          <div className={sectionHeaderCls}>
            <div className="p-2 bg-white dark:bg-surface-900 rounded-lg text-primary-600 shadow-sm">
              <IconStethoscope size={18} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">2. Clinical Findings & Presentation</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <label className={labelCls}>Primary Medical Diagnosis <span className="text-error">*</span></label>
                 <input type="text" required className={inputCls} placeholder="Working impression" value={form.primaryDiagnosis} onChange={e => setForm({...form, primaryDiagnosis: e.target.value})} />
               </div>
               <div>
                 <label className={labelCls}>Other Co-morbidities / Diagnoses</label>
                 <input type="text" className={inputCls} value={form.otherDiagnoses || ''} onChange={e => setForm({...form, otherDiagnoses: e.target.value})} />
               </div>
            </div>

            <div>
              <label className={labelCls}>Current Vital Signs</label>
              <input type="text" className={inputCls} placeholder="e.g. BP: 120/80, Temp: 37C, HR: 80" value={form.vitalSigns || ''} onChange={e => setForm({...form, vitalSigns: e.target.value})} />
            </div>

            <div>
              <label className={labelCls}>Clinical History & Present Presentation <span className="text-error">*</span></label>
              <textarea required className={areaCls} value={form.clinicalSummary} onChange={e => setForm({...form, clinicalSummary: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 bg-surface-50 dark:bg-surface-950 p-6 rounded-lg border border-primary-50 dark:border-primary-800">
               <div>
                 <label className={labelCls}>Known Allergies</label>
                 <input type="text" className={inputCls} value={form.allergies || ''} onChange={e => setForm({...form, allergies: e.target.value})} />
               </div>
               <div>
                 <label className={labelCls}>Current Active Medications</label>
                 <input type="text" className={inputCls} value={form.currentMedications || ''} onChange={e => setForm({...form, currentMedications: e.target.value})} />
               </div>
            </div>

            <div>
              <label className={labelCls}>Treatment Administered at Origin</label>
              <textarea className={areaCls} value={form.treatmentGiven || ''} onChange={e => setForm({...form, treatmentGiven: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 3: Transfer Logistics */}
        <div className={sectionCls}>
          <div className={sectionHeaderCls}>
            <div className="p-2 bg-white dark:bg-surface-900 rounded-lg text-primary-600 shadow-sm">
              <IconTruck size={18} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white">3. Triage & Transfer Routing</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className={labelCls}>Primary Medical Reason for Referral <span className="text-error">*</span></label>
              <input type="text" required className={inputCls} placeholder="e.g. Specialized surgery / NICU admission required" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>Priority Level <span className="text-error">*</span></label>
              <select required className={inputCls} value={form.priority} onChange={e => setForm({...form, priority: e.target.value as ReferralPriority})}>
                <option value="routine">ROUTINE (Elective Queue)</option>
                <option value="urgent">URGENT (24-hour stabilization)</option>
                <option value="emergency">EMERGENCY (Immediate transfer required)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Expected Clinical Service Needed</label>
              <input type="text" className={inputCls} placeholder="e.g. Neurosurgery, CT Scan, Specialist opinion" value={form.serviceType || ''} onChange={e => setForm({...form, serviceType: e.target.value})} />
            </div>
            {/* Only show destination routing for non-clinicians (Liaison, Admin) */}
            {user?.role !== 'doctor' && user?.role !== 'hew' && (
              <div className="col-span-2 p-6 border-2 border-dashed border-primary-100 dark:border-primary-800 rounded-xl bg-primary-50/30">
                <label className={labelCls}>Preferred Destination Facility (Optional)</label>
                <select 
                  className={inputCls + " border-primary-200"}
                  value={form.receivingFacilityId || ''}
                  onChange={e => setForm({...form, receivingFacilityId: e.target.value})}
                >
                  <option value="">REGIONAL ROUTING (Liaison will decide best destination)</option>
                  {facilities?.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type?.replace('_', ' ')})</option>
                  ))}
                </select>
                <p className="text-[9px] text-primary-400 font-bold uppercase mt-3 tracking-wider italic leading-relaxed">
                  * Final destination routing is subject to Liaison coordination and clinical availability matrix.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Consent Section */}
        <div className="flex items-start gap-4 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 mb-10 transition-all hover:shadow-md">
            <div className="pt-1">
              <input 
                type="checkbox" 
                id="consent"
                className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                checked={form.consentGiven}
                onChange={e => setForm({...form, consentGiven: e.target.checked})}
              />
            </div>
            <label htmlFor="consent" className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-widest leading-relaxed cursor-pointer select-none">
              Informed consent has been obtained from the patient or legal guardian for this referral and data sharing as per TRRMS Protocol and National Proclamation.
            </label>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 text-error rounded-lg shadow-sm mb-8 animate-shake">
            <IconAlertCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{error}</span>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-t border-primary-100 dark:border-primary-800 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
             <Button variant="secondary" type="button" size="lg" onClick={() => navigate(-1)}>
               Cancel
             </Button>
             <Button variant="primary" type="submit" size="lg" isLoading={mutation.isPending} className="px-10 shadow-xl shadow-primary-900/20">
               <IconSend size={18} /> Finalize Referral
             </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
