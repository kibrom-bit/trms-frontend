import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Facility, ServiceStatus } from '../../types/api';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { 
  IconBuilding, 
  IconPhone, 
  IconMapPin, 
  IconSearch, 
  IconAdjustmentsHorizontal,
  IconArrowRight,
  IconX
} from '@tabler/icons-react';

export default function Directory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await apiClient.get<Facility[]>('/facilities');
      return response.data;
    },
  });

  const filteredFacilities = facilities?.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceSummary = (facility: Facility) => {
    const services = facility.services || [];
    const available = services.filter(s => s.status === ServiceStatus.AVAILABLE).length;
    return `${available}/${services.length} SVCS`;
  };

  const statusBadge = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.AVAILABLE: return <Badge label="Available" variant="success" />;
      case ServiceStatus.LIMITED: return <Badge label="Limited" variant="warning" />;
      case ServiceStatus.UNAVAILABLE: return <Badge label="Unavailable" variant="error" />;
      default: return <Badge label={status} />;
    }
  };

  const columns = [
    { 
      header: 'Facility Name', 
      accessor: (f: Facility) => (
        <div className="font-black uppercase tracking-tight text-primary-900 dark:text-white">{f.name}</div>
      )
    },
    { 
      header: 'Type', 
      accessor: (f: Facility) => (
        <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{f.type?.replace('_', ' ')}</div>
      ),
      className: 'w-32'
    },
    { 
      header: 'Location', 
      accessor: (f: Facility) => (
        <div className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400">
          <IconMapPin size={12} />
          {f.location}
        </div>
      )
    },
    { 
      header: 'Service Capacity', 
      accessor: (f: Facility) => (
        <div className="font-mono text-[10px] font-bold text-primary-500 uppercase tracking-tighter">
          {getServiceSummary(f)}
        </div>
      ),
      className: 'w-24'
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">
            Facility Directory
          </h1>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
            Network availability and capabilities
          </p>
        </div>

        <div className="relative w-64">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
          <input 
            type="text"
            className="input-field pl-10 h-9 text-xs font-bold uppercase tracking-widest"
            placeholder="Search network..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <DataTable 
              columns={columns} 
              data={filteredFacilities || []} 
              isLoading={isLoading} 
              onRowClick={setSelectedFacility}
            />
          </div>
        </div>

        {/* Facility Details / Capability Panel */}
        {selectedFacility && (
          <div className="w-96 flex flex-col bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded shadow-lg overflow-hidden animate-slide-in">
            <div className="p-4 border-b border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-900 dark:text-white font-black uppercase tracking-tight text-sm">
                <IconBuilding size={18} />
                Facility Capability
              </div>
              <button 
                onClick={() => setSelectedFacility(null)}
                className="text-primary-400 hover:text-black dark:hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1.5">Identification</h4>
                  <p className="text-base font-black text-primary-900 dark:text-white uppercase leading-tight">
                    {selectedFacility.name}
                  </p>
                  <p className="text-xs text-primary-500 font-bold uppercase mt-1">
                    {selectedFacility.type?.replace('_', ' ')}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-primary-50 dark:border-primary-800">
                  <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300">
                    <IconMapPin size={14} className="text-primary-400" />
                    {selectedFacility.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300">
                    <IconPhone size={14} className="text-primary-400" />
                    {selectedFacility.contact}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary-50 dark:border-primary-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Services</h4>
                  <span className="text-[10px] font-black bg-primary-100 dark:bg-primary-900 px-1.5 py-0.5 rounded">
                    {selectedFacility.services?.length || 0} TOTAL
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedFacility.services?.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-2 rounded border border-primary-50 dark:border-primary-800 bg-surface-50/50 dark:bg-surface-950/50 group">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase text-primary-800 dark:text-primary-200">{svc.serviceType}</span>
                        {svc.estimatedDelayDays && svc.estimatedDelayDays > 0 ? (
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter italic">
                            Wait: ~{svc.estimatedDelayDays} days
                          </span>
                        ) : null}
                      </div>
                      {statusBadge(svc.status || ServiceStatus.AVAILABLE)}
                    </div>
                  ))}
                  {(!selectedFacility.services || selectedFacility.services.length === 0) && (
                    <div className="text-center py-4 text-xs font-bold text-primary-400 uppercase italic">
                      No registered services
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-primary-100 dark:border-primary-800 bg-surface-50 dark:bg-surface-950">
              <Button variant="secondary" className="w-full">
                Generate Network Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
