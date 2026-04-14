import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../services/api';
import { Facility, Service, ServiceStatus } from '../../../types/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  IconHistory, 
  IconRefresh, 
  IconClock, 
  IconAlertCircle,
  IconCheck,
  IconDotsVertical
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';

interface ServiceStatusConsoleProps {
  facilityId: string;
}

export function ServiceStatusConsole({ facilityId }: ServiceStatusConsoleProps) {
  const queryClient = useQueryClient();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ServiceStatus>(ServiceStatus.AVAILABLE);
  const [newDelay, setNewDelay] = useState(0);

  const { data: facility, isLoading } = useQuery({
    queryKey: ['facility-services', facilityId],
    queryFn: async () => {
      const response = await apiClient.get<Facility>(`/facilities/${facilityId}`);
      return response.data;
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: (data: { serviceId: string, status: ServiceStatus, estimatedDelayDays: number }) => 
      apiClient.patch(`/facilities/services/${data.serviceId}`, {
        status: data.status,
        estimatedDelayDays: data.estimatedDelayDays
      }),
    onSuccess: () => {
      toast.success('Service status updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['facility-services'] });
      setEditingServiceId(null);
    },
    onError: () => toast.error('Failed to update service status.')
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-900 animate-spin mb-3" />
        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Loading Infrastructure...</span>
      </div>
    );
  }

  const services = facility?.services || [];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Facility Capability Matrix</h3>
          <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mt-1">Real-time clinical uptime and delay coordination</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries()} className="flex items-center gap-2">
          <IconRefresh size={14} />
          Sync Status
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map((svc) => (
          <div 
            key={svc.id}
            className={`
              p-6 rounded-lg border transition-all flex items-center justify-between
              ${editingServiceId === svc.id 
                ? 'bg-primary-50 dark:bg-surface-950 border-primary-900 scale-[1.01] shadow-xl' 
                : 'bg-white dark:bg-surface-800 border-primary-50 dark:border-primary-800 hover:border-primary-200 dark:hover:border-primary-600'
              }
            `}
          >
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded flex items-center justify-center font-black text-white ${
                svc.status === ServiceStatus.AVAILABLE ? 'bg-emerald-500' :
                svc.status === ServiceStatus.LIMITED ? 'bg-amber-500' : 'bg-red-500'
              }`}>
                {svc.serviceType?.charAt(0)}
              </div>
              
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-primary-900 dark:text-white leading-none mb-2">
                  {svc.serviceType}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                    <IconClock size={12} />
                    Delay: {svc.estimatedDelayDays || 0} Days
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                    <IconHistory size={12} />
                    Last Updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {editingServiceId === svc.id ? (
                <div className="flex items-center gap-4 animate-slide-in">
                   <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-extrabold uppercase text-primary-400 tracking-tighter">Availability Status</span>
                     <select 
                       className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-surface-900 border border-primary-300 dark:border-primary-700 rounded px-2 h-8"
                       value={newStatus}
                       onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
                     >
                        <option value={ServiceStatus.AVAILABLE}>AVAILABLE</option>
                        <option value={ServiceStatus.LIMITED}>LIMITED</option>
                        <option value={ServiceStatus.UNAVAILABLE}>UNAVAILABLE</option>
                     </select>
                   </div>

                   <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-extrabold uppercase text-primary-400 tracking-tighter">Delay Days</span>
                     <input 
                       type="number" 
                       className="text-[10px] font-black uppercase tracking-widest w-20 bg-white dark:bg-surface-900 border border-primary-300 dark:border-primary-700 rounded px-2 h-8"
                       value={newDelay}
                       onChange={(e) => setNewDelay(parseInt(e.target.value) || 0)}
                     />
                   </div>

                   <div className="flex gap-1 pt-4">
                     <Button size="sm" variant="secondary" onClick={() => setEditingServiceId(null)}>CANCEL</Button>
                     <Button 
                       size="sm" 
                       variant="primary" 
                       onClick={() => updateServiceMutation.mutate({ 
                         serviceId: svc.id, 
                         status: newStatus, 
                         estimatedDelayDays: newDelay 
                       })}
                       isLoading={updateServiceMutation.isPending}
                     >
                       SAVE
                     </Button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge 
                      label={svc.status || 'available'} 
                      variant={(svc.status === 'available' ? 'success' : svc.status === 'limited' ? 'warning' : 'error') as any} 
                    />
                    {svc.status === ServiceStatus.LIMITED && (
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter animate-pulse">
                        Significant backlog reported
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="ml-4 h-9 px-4 font-black text-[10px] tracking-widest uppercase border border-primary-200 dark:border-primary-800"
                    onClick={() => {
                       setEditingServiceId(svc.id);
                       setNewStatus(svc.status || ServiceStatus.AVAILABLE);
                       setNewDelay(svc.estimatedDelayDays || 0);
                    }}
                  >
                    Manage
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary-100 dark:border-primary-800 rounded bg-surface-50/50 dark:bg-surface-950/20">
             <IconAlertCircle size={32} className="text-primary-100 mb-3" />
             <p className="text-xs font-bold text-primary-400 uppercase tracking-[0.3em]">No services registered at this node</p>
             <p className="text-[10px] text-primary-300 mt-2">Please contact System Admin to enroll clinical services.</p>
          </div>
        )}
      </div>
    </div>
  );
}
