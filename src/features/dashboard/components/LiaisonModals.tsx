import React, { useState } from 'react';
import { 
  Referral, 
  Department, 
  Facility, 
  ServiceStatus 
} from '../../../types/api';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  IconX, 
  IconCheck, 
  IconArrowRight, 
  IconSearch, 
  IconBuildingHospital,
  IconMapPin,
  IconClock
} from '@tabler/icons-react';

interface AcceptModalProps {
  referral: Referral;
  departments: Department[];
  onAccept: (data: { receivingDepartmentId: string, waitingTime?: string }) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function AcceptModal({ referral, departments, onAccept, onClose, isSubmitting }: AcceptModalProps) {
  const [receivingDepartmentId, setReceivingDepartmentId] = useState('');
  const [waitingTime, setWaitingTime] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
        <div className="p-4 border-b border-primary-50 dark:border-primary-800 flex items-center justify-between bg-primary-50/50 dark:bg-surface-950/50">
          <h3 className="font-black uppercase tracking-tight text-primary-900 dark:text-white flex items-center gap-2">
            <IconCheck size={18} className="text-emerald-500" />
            Accept Referral
          </h3>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-900 dark:hover:text-white transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded border border-primary-50 dark:border-primary-800">
            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Patient</p>
            <p className="font-black text-primary-900 dark:text-white uppercase">{referral.patientName}</p>
            <p className="text-xs text-primary-500">{referral.primaryDiagnosis}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5 font-sans">
                Assign to Department <span className="text-error">*</span>
              </label>
              <select 
                className="input-field w-full font-bold uppercase tracking-widest text-xs"
                value={receivingDepartmentId}
                onChange={(e) => setReceivingDepartmentId(e.target.value)}
                autoFocus
              >
                <option value="">Select Department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5 font-sans">
                Estimated Waiting Time (Optional)
              </label>
              <input 
                type="text"
                placeholder="e.g. 2 days, immediate"
                className="input-field w-full font-bold uppercase tracking-widest text-xs"
                value={waitingTime}
                onChange={(e) => setWaitingTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary-50/30 dark:bg-surface-950/30 border-t border-primary-50 dark:border-primary-800 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1" 
            onClick={() => onAccept({ receivingDepartmentId, waitingTime })}
            disabled={!receivingDepartmentId || isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm Acceptance
          </Button>
        </div>
      </div>
    </div>
  );
}

interface RejectModalProps {
  referral: Referral;
  onReject: (data: { reason: string }) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function RejectModal({ referral, onReject, onClose, isSubmitting }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const reasons = [
    'Service not available',
    'Bed full',
    'Inappropriate referral',
    'Equipment failure',
    'Staff shortage',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
        <div className="p-4 border-b border-primary-50 dark:border-primary-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/10">
          <h3 className="font-black uppercase tracking-tight text-red-600 dark:text-red-400 flex items-center gap-2">
            <IconX size={18} />
            Reject Referral
          </h3>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-900 dark:hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">
                Rejection Reason <span className="text-error">*</span>
              </label>
              <select 
                className="input-field w-full font-bold uppercase tracking-widest text-xs"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select Reason...</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {reason === 'Other' && (
              <textarea 
                className="input-field w-full min-h-[100px] text-xs font-bold uppercase tracking-widest p-3"
                placeholder="Please specify detailed reason..."
                onChange={(e) => setReason('Other: ' + e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="p-4 bg-red-50/30 dark:bg-red-950/5 border-t border-primary-50 dark:border-primary-800 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="flex-1" 
            onClick={() => onReject({ reason })}
            disabled={!reason || isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FacilitySearchModalProps {
  onSelect: (facility: Facility) => void;
  onClose: () => void;
  facilities: Facility[];
  isLoading?: boolean;
}

export function FacilitySearchModal({ onSelect, onClose, facilities, isLoading }: FacilitySearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = facilities.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.services?.some(s => s.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-zoom-in">
        <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50/50 dark:bg-surface-950/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary-900 text-white flex items-center justify-center">
              <IconBuildingHospital size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-primary-900 dark:text-white leading-tight">
                Network Facility Search
              </h3>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Select target facility node for referral</p>
            </div>
          </div>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-900 dark:hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 bg-surface-50 dark:bg-surface-950 border-b border-primary-100 dark:border-primary-800">
           <div className="relative max-w-lg mx-auto">
             <IconSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
             <input 
               type="text" 
               className="input-field pl-12 h-12 text-sm font-bold uppercase tracking-[0.2em] shadow-inner"
               placeholder="Search by name or clinical service..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               autoFocus
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-900 animate-spin mb-4" />
                <p className="text-xs font-bold text-primary-400 uppercase tracking-[0.3em]">Querying Network Status...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((facility) => (
                <div 
                  key={facility.id}
                  onClick={() => onSelect(facility)}
                  className="group bg-white dark:bg-surface-800 border border-primary-100 dark:border-primary-800 rounded p-4 hover:border-primary-900 dark:hover:border-primary-400 cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded bg-primary-50 dark:bg-surface-900 flex items-center justify-center text-primary-900 dark:text-white group-hover:bg-primary-900 group-hover:text-white transition-colors">
                      <IconBuildingHospital size={22} />
                    </div>
                    <Badge label={facility.type || ''} size="sm" />
                  </div>
                  <h4 className="font-black uppercase tracking-tight text-primary-900 dark:text-white mb-1 leading-tight group-hover:text-primary-900 transition-colors">
                    {facility.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-4">
                    <IconMapPin size={12} />
                    {facility.location}
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-primary-50 dark:border-primary-800">
                    <p className="text-[9px] font-bold text-primary-300 uppercase tracking-widest mb-2">Service Availability</p>
                    {facility.services?.slice(0, 3).map(svc => (
                      <div key={svc.id} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 truncate pr-2">{svc.serviceType}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          svc.status === ServiceStatus.AVAILABLE ? 'bg-emerald-500' :
                          svc.status === ServiceStatus.LIMITED ? 'bg-amber-500' : 'bg-red-500'
                        }`} title={svc.status} />
                      </div>
                    ))}
                    {(facility.services?.length || 0) > 3 && (
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-tighter pt-1">
                          + {facility.services!.length - 3} more services
                        </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-primary-50/30 dark:bg-surface-950/30 border-t border-primary-50 dark:border-primary-800 text-center">
            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
              Showing {filtered.length} matching facility nodes
            </p>
        </div>
      </div>
    </div>
  );
}
