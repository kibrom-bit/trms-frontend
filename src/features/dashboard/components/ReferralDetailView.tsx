import React from 'react';
import { Referral } from '../../../types/api';
import { Badge } from '../../../components/ui/Badge';
import { 
  IconUser, 
  IconStethoscope, 
  IconAlertCircle, 
  IconHistory, 
  IconPill,
  IconCalendar,
  IconBuilding,
  IconActivity,
  IconCircleCheck,
  IconSend
} from '@tabler/icons-react';

interface ReferralDetailViewProps {
  referral: Referral;
}

export function ReferralDetailView({ referral }: ReferralDetailViewProps) {
  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 border-b border-primary-100 dark:border-primary-800 pb-2 mb-4 mt-6 first:mt-0">
      <Icon size={18} className="text-primary-900 dark:text-primary-400" />
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-900 dark:text-white">{title}</h3>
    </div>
  );

  const DataItem = ({ label, value }: { label: string, value?: string | React.ReactNode }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest leading-none">{label}</p>
      <div className="text-sm font-medium text-primary-900 dark:text-white uppercase tracking-tight leading-snug">
        {value || <span className="text-primary-200 italic">Not provided</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-900 p-8 font-sans max-h-[70vh] overflow-y-auto">
      {/* Patient Profile Header */}
      <div className="flex items-start justify-between mb-8 p-6 bg-primary-50 dark:bg-surface-950 rounded border border-primary-100 dark:border-primary-800">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded bg-primary-900 text-white flex items-center justify-center font-black text-2xl">
            {referral.patientName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-primary-900 dark:text-white leading-none mb-2">
              {referral.patient?.fullName || referral.patientName}
            </h2>
            <div className="flex items-center gap-3">
               <Badge label={referral.patient?.gender || referral.patientGender || 'unknown'} variant="info" size="sm" />
               <div className="flex items-center gap-1 text-xs font-bold text-primary-500 uppercase tracking-widest">
                 <IconCalendar size={14} />
                 DOB: {referral.patient?.dateOfBirth ? new Date(referral.patient.dateOfBirth).toLocaleDateString() : (referral.patientDob ? new Date(referral.patientDob).toLocaleDateString() : 'Unknown')}
               </div>
               {referral.mrn && (
                 <div className="bg-primary-900 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-tighter">
                   MRN: {referral.mrn}
                 </div>
               )}
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
           <Badge 
             label={referral.priority || 'routine'} 
             variant={(referral.priority === 'emergency' ? 'error' : referral.priority === 'urgent' ? 'warning' : 'info') as any} 
             size="md"
             pulse={referral.priority === 'emergency'}
           />
           <div className="bg-white dark:bg-surface-900 px-3 py-2 rounded border border-primary-100 dark:border-primary-800 flex flex-col items-end shadow-sm">
             <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Tracking Reference</p>
             <p className="text-xs font-black text-primary-900 dark:text-white font-mono uppercase truncate max-w-[150px]">
               {referral.id}
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Origins and Clinical Context */}
        <div className="space-y-8">
          <section>
            <SectionHeader icon={IconBuilding} title="Referral Path" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DataItem label="Referring Node" value={referral.referringFacility?.name || 'Unknown Facility'} />
              <DataItem label="Target Status" value={referral.receivingDepartmentId ? 'Active In-Facility' : 'Awaiting Routing'} />
              <DataItem label="Service Category" value={referral.serviceType || 'General Clinical'} />
              <DataItem label="Timestamp" value={new Date(referral.createdAt || '').toLocaleString()} />
            </div>
          </section>

          <section>
            <SectionHeader icon={IconUser} title="Practitioner Credentials" />
            <div className="bg-surface-50 dark:bg-surface-950 p-4 rounded border border-primary-100 dark:border-primary-800 space-y-4">
               <div>
                 <p className="text-sm font-black text-primary-900 dark:text-white uppercase tracking-tight">
                   {referral.referringUser?.fullName} {referral.referringUser?.specialityDescription ? `(${referral.referringUser.specialityDescription})` : '(Practitioner)'}
                 </p>
               </div>
               <div className="flex items-center gap-4 border-t border-primary-100 dark:border-primary-800 pt-3 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 uppercase">
                    <span className="text-primary-300">TEL:</span> {referral.referringUser?.phone || 'NOT LISTED'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 uppercase">
                    <span className="text-primary-300">MAIL:</span> {referral.referringUser?.email || 'N/A'}
                  </div>
               </div>
            </div>
          </section>

          <section>
            <SectionHeader icon={IconStethoscope} title="Clinical Summary" />
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-sm font-medium leading-relaxed bg-surface-50 dark:bg-surface-950 p-4 rounded border border-primary-50 dark:border-primary-800">
                {referral.clinicalSummary}
              </p>
            </div>
          </section>

          <section>
            <SectionHeader icon={IconAlertCircle} title="Diagnoses" />
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/10 border-l-4 border-red-500 rounded">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Primary Diagnosis</p>
                <p className="text-base font-black uppercase tracking-tight text-red-700 dark:text-red-400">
                  {referral.primaryDiagnosis}
                </p>
              </div>
              {referral.otherDiagnoses && (
                <div className="p-4 bg-surface-50 dark:bg-surface-950 border-l-4 border-primary-500 rounded">
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Other Diagnoses</p>
                  <p className="text-sm font-bold uppercase tracking-tight text-primary-900 dark:text-white">
                    {referral.otherDiagnoses}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Medical History and Vital Signs */}
        <div className="space-y-8">
          <section>
            <SectionHeader icon={IconActivity} title="Current Vital Signs" />
            <div className="bg-primary-900 text-white p-6 rounded-lg shadow-inner border-2 border-primary-800">
               <pre className="whitespace-pre-wrap font-mono text-lg font-black tracking-tighter leading-tight">
                 {referral.vitalSigns || 'VITAL SIGNS NOT RECORDED'}
               </pre>
            </div>
          </section>

          <section>
            <SectionHeader icon={IconUser} title="Patient Logistics" />
            <div className="grid grid-cols-1 gap-4">
              <DataItem label="Contact Number" value={referral.patient?.phoneNumber || referral.patientPhone || 'No contact listed'} />
              <DataItem label="Registered Local Address" value={referral.patient?.address || 'Information Restricted to Liaison Desk'} />
            </div>
          </section>

          <section>
            <SectionHeader icon={IconHistory} title="Clinical Deep-Dive" />
            <div className="space-y-4">
              <DataItem label="Reason for Referral" value={referral.reasonForReferral} />
              <DataItem label="Current Medications" value={referral.currentMedications} />
              <DataItem label="Allergies" value={
                referral.allergies ? (
                  <span className="text-error font-black uppercase underline decoration-double">{referral.allergies}</span>
                ) : 'No known drug allergies'
              } />
            </div>
          </section>

          <section>
            <SectionHeader icon={IconHistory} title="Medical History" />
            <div className="space-y-4">
              <DataItem label="Past Medical History" value={referral.pastMedicalHistory} />
            </div>
          </section>

          <section>
            <SectionHeader icon={IconPill} title="Medications & Treatment" />
            <div className="space-y-4">
              <DataItem label="Current Medications" value={referral.currentMedications} />
              <DataItem label="Treatment Given to Date" value={
                 <div className="text-sm italic font-medium">
                   {referral.treatmentGiven || 'No pre-referral treatment reported.'}
                 </div>
              } />
            </div>
          </section>
        </div>
      </div>

      {/* --- Referral Feedback Section (Full SLIP) --- */}
      {referral.dischargeSummary && (
        <div className="mt-12 border-t-4 border-emerald-500 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-3 mb-6">
             <div className="bg-emerald-500 text-white p-2 rounded shadow-lg">
               <IconCircleCheck size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-tighter text-emerald-600 leading-none">Referral Feedback</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mt-1">Discharge Summary & Continuity of Care</p>
             </div>
           </div>

           <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border-2 border-emerald-100 dark:border-emerald-900 rounded-xl overflow-hidden shadow-xl">
              {/* Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-emerald-100 dark:bg-emerald-900">
                <div className="bg-white dark:bg-surface-900 p-4">
                   <p className="text-[9px] font-black text-primary-300 uppercase tracking-widest mb-1">Receiving Facility</p>
                   <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{referral.receivingFacility?.name || 'Assigned Facility'}</p>
                </div>
                <div className="bg-white dark:bg-surface-900 p-4">
                   <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">Assigned Department</p>
                   <p className="text-sm font-bold text-primary-900 dark:text-white uppercase tracking-tight">Surgery / Internal Medicine</p>
                </div>
                <div className="bg-white dark:bg-surface-900 p-4">
                   <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">Discharge Date</p>
                   <p className="text-sm font-black text-primary-900 dark:text-white uppercase tracking-tight">
                     {referral.dischargeSummary.dischargeDate ? new Date(referral.dischargeSummary.dischargeDate).toLocaleDateString() : 'N/A'}
                   </p>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-surface-900/50">
                 {/* Clinical Summary */}
                 <div className="space-y-8">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-3 border-b border-emerald-50 pb-1">
                        Diagnosis & Outcome
                      </h4>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border-l-4 border-emerald-500">
                        <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase mb-1">Final Diagnosis</p>
                        <p className="text-base font-black text-primary-900 dark:text-white uppercase tracking-tight">
                          {referral.dischargeSummary.finalDiagnosis}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-3 border-b border-emerald-50 pb-1">
                        Treatment Narrative
                      </h4>
                      <p className="text-sm font-medium leading-relaxed text-primary-900 dark:text-gray-200 indent-4">
                        {referral.dischargeSummary.summary}
                      </p>
                    </div>

                    {referral.dischargeSummary.specialInvestigations && (
                      <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-[0.15em] mb-3 border-b border-primary-50 pb-1">
                          Special Investigations
                        </h4>
                        <div className="bg-surface-50 dark:bg-surface-950 p-4 rounded border border-primary-100 dark:border-primary-800">
                          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 whitespace-pre-wrap italic">
                            {referral.dischargeSummary.specialInvestigations}
                          </p>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Continuity of Care */}
                 <div className="space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-950/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <IconPill size={16} /> Continuity Plan
                      </h4>
                      <div className="space-y-5">
                         <DataItem label="Discharge Medications" value={referral.dischargeSummary.medicationsPrescribed} />
                         <DataItem label="Follow-Up Instructions" value={referral.dischargeSummary.followUpInstructions} />
                      </div>
                    </div>

                    {referral.dischargeSummary.ongoingCareInstructions && (
                      <div>
                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Primary Care Recommendations</h4>
                        <p className="text-xs font-medium text-primary-600 dark:text-primary-400 leading-relaxed border-l-2 border-primary-200 pl-4 py-1">
                          {referral.dischargeSummary.ongoingCareInstructions}
                        </p>
                      </div>
                    )}

                    {referral.dischargeSummary.referBackTo && (
                      <div className="flex items-center justify-between p-4 bg-primary-900 text-white rounded shadow-md">
                        <div className="flex items-center gap-3">
                           <IconSend size={18} className="text-primary-300" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Refer Back To</span>
                        </div>
                        <span className="text-sm font-black uppercase">{referral.dischargeSummary.referBackTo}</span>
                      </div>
                    )}
                 </div>
              </div>

              {/* Administrative Footer */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 border-t border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">Electronic Signature</div>
                    <div className="h-4 w-px bg-emerald-200 dark:bg-emerald-800" />
                    <div className="text-sm font-black text-primary-900 dark:text-white uppercase italic tracking-tight underline decoration-emerald-500 decoration-2 underline-offset-4">
                      {referral.dischargeSummary.completedBy?.fullName || "AUTHORIZED PRACTITIONER"}
                    </div>
                 </div>
                 <div className="text-[9px] font-black text-primary-400 uppercase tracking-widest">
                   Timestamp: {new Date().toLocaleString()}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
