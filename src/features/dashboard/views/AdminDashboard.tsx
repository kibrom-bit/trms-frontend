import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api';
import { Facility } from '../../../types/api';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  IconBuilding, 
  IconPlus, 
  IconArrowRight, 
  IconBuildingHospital,
  IconMapPin,
  IconShieldCheck
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: facilities, isLoading } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: async () => {
      const response = await apiClient.get<Facility[]>('/facilities');
      return response.data;
    },
  });

  const specialized = facilities?.filter(f => f.type === 'specialized_hospital').length || 0;
  const general = facilities?.filter(f => f.type === 'general_hospital').length || 0;
  const primary = facilities?.filter(f => f.type === 'primary_hospital').length || 0;
  const clinics = facilities?.filter(f => f.type === 'health_center').length || 0;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-10">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">Network Command</h2>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Regional Health Node Infrastructure</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/facilities">
            <Button variant="primary" className="h-12 px-6 flex items-center gap-2 group">
              <IconPlus size={20} className="group-hover:rotate-90 transition-transform" />
              Register New Node
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Overview Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-900 text-white flex items-center justify-center dark:bg-primary-800">
                  <IconBuildingHospital size={24} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white">Active Nodes</h3>
              </div>
              <p className="text-4xl font-black text-primary-900 dark:text-white">{facilities?.length || 0}</p>
              <p className="text-[10px] font-bold text-primary-400 uppercase mt-2">Registered Health Facilities</p>
            </div>

            <div className="p-6 bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary-500 text-white flex items-center justify-center">
                  <IconShieldCheck size={24} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white">Node Health</h3>
              </div>
              <p className="text-4xl font-black text-primary-900 dark:text-white">100%</p>
              <p className="text-[10px] font-bold text-primary-400 uppercase mt-2">Operational Integrity</p>
            </div>
          </div>

          {/* Node Distribution Stats */}
          <div className="p-8 bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 mb-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              Node Composition
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <p className="text-2xl font-black text-primary-900 dark:text-white">{specialized}</p>
                <p className="text-[10px] font-bold text-primary-400 uppercase leading-tight">Specialized Hospitals</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary-900 dark:text-white">{general}</p>
                <p className="text-[10px] font-bold text-primary-400 uppercase leading-tight">General Hospitals</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary-900 dark:text-white">{primary}</p>
                <p className="text-[10px] font-bold text-primary-400 uppercase leading-tight">Primary Hospitals</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary-900 dark:text-white">{clinics}</p>
                <p className="text-[10px] font-bold text-primary-400 uppercase leading-tight">Health Centers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
            <IconBuilding size={16} />
            Recent Facilities
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-primary-50 dark:bg-surface-800 rounded-xl" />)}
              </div>
            ) : (
              facilities?.slice(0, 4).map((f) => (
                <div key={f.id} className="p-4 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black text-primary-900 dark:text-white uppercase truncate max-w-[150px]">{f.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <IconMapPin size={10} className="text-primary-400" />
                        <p className="text-[10px] font-bold text-primary-400 uppercase">{f.location || 'Unknown'}</p>
                      </div>
                    </div>
                    <Badge 
                      label={f.type?.replace('_', ' ') || 'Unknown'} 
                      variant="info"
                      className="text-[8px] px-1.5"
                    />
                  </div>
                </div>
              ))
            )}
            
            <Link to="/admin/facilities" className="flex items-center justify-between p-4 bg-primary-900 dark:bg-primary-800 text-white rounded-xl group hover:scale-[1.02] transition-transform shadow-lg shadow-primary-900/10 dark:shadow-none">
              <span className="text-xs font-bold uppercase tracking-widest">Full Node Registry</span>
              <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
