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
  IconShieldCheck,
  IconUsers,
  IconActivity,
  IconExternalLink
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getBackendUrl } from '../../../utils/url-utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
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
    <div className="space-y-10 animate-fade-in font-sans pb-20">
      {/* Refined Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-secondary-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge label="System Authority" variant="info" className="bg-white/10 text-white border-none text-[8px] uppercase font-black tracking-widest pl-0" />
              <div className="h-[1px] w-8 bg-white/20" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-white">Network Command</h1>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-400" />
              Infrastructure Synchronized
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[160px]">
              <p className="text-[10px] font-black uppercase text-white/40 mb-1">Active Nodes</p>
              <p className="text-4xl font-black">{facilities?.length || 0}</p>
            </div>
            <Link to="/admin/facilities">
              <Button variant="secondary" className="h-12 px-6 rounded-2xl bg-white text-primary-900 border-none hover:bg-secondary-50 transition-all hover:scale-105 active:scale-95 group">
                <IconPlus size={18} className="group-hover:rotate-90 transition-transform duration-300 mr-2" />
                <span className="text-xs font-black uppercase tracking-tight">Register Node</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Metrics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-900 flex items-center justify-center dark:bg-surface-800 dark:text-primary-100 group-hover:bg-primary-900 group-hover:text-white transition-all duration-300">
                  <IconBuildingHospital size={28} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary-900 dark:text-white leading-none">100%</p>
                  <p className="text-[10px] font-bold text-green-500 uppercase mt-1">Uptime</p>
                </div>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-900 dark:text-white">Node Resilience</h3>
              <p className="text-[10px] font-bold text-primary-600 uppercase mt-2 leading-relaxed tracking-wider">All regional facilities reporting active heartbeats.</p>
            </div>

            <div className="p-8 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-secondary-50 text-secondary-600 flex items-center justify-center group-hover:bg-secondary-600 group-hover:text-white transition-all duration-300">
                  <IconActivity size={28} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary-900 dark:text-white leading-none">High</p>
                  <p className="text-[10px] font-bold text-secondary-500 uppercase mt-1">Traffic</p>
                </div>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-900 dark:text-white">System Throughput</h3>
              <p className="text-[10px] font-bold text-primary-600 uppercase mt-2 leading-relaxed tracking-wider">Integrated referral engine operating at peak efficiency.</p>
            </div>
          </div>

          {/* Node Distribution Stats */}
          <div className="p-10 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-[2.5rem] shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-surface-800 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 dark:text-white mb-10 flex items-center gap-3">
              <IconBuilding size={16} />
              Network Composition
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
              <div className="space-y-1">
                <p className="text-4xl font-black text-primary-900 dark:text-white">{specialized}</p>
                <p className="text-[9px] font-black text-primary-600 uppercase leading-tight tracking-[0.2em]">Specialized</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-primary-900 dark:text-white">{general}</p>
                <p className="text-[9px] font-black text-primary-600 uppercase leading-tight tracking-[0.2em]">General</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-primary-900 dark:text-white">{primary}</p>
                <p className="text-[9px] font-black text-primary-600 uppercase leading-tight tracking-[0.2em]">Primary</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-primary-900 dark:text-white">{clinics}</p>
                <p className="text-[9px] font-black text-primary-600 uppercase leading-tight tracking-[0.2em]">Health Centers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Nodes with Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary-900 dark:text-white">Active Registry</h3>
            <Link to="/admin/facilities" className="text-[10px] font-black text-primary-400 hover:text-primary-900 uppercase tracking-widest transition-colors">See All</Link>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-3xl" />)}
              </div>
            ) : (
              facilities?.slice(0, 5).map((f) => (
                <div 
                  key={f.id} 
                  onClick={() => navigate(`/admin/facilities/${f.id}`)}
                  className="p-5 bg-white dark:bg-surface-900 border border-primary-50 dark:border-primary-800 rounded-3xl hover:border-primary-200 dark:hover:border-primary-700 transition-all group cursor-pointer hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-primary-900 group-hover:text-white transition-all overflow-hidden border border-primary-50 dark:border-primary-800">
                        {f.profileImageUrl ? (
                          <img src={getBackendUrl(f.profileImageUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <IconBuildingHospital size={24} className="opacity-40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-primary-900 dark:text-white uppercase truncate tracking-tight">{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-black text-primary-600 uppercase tracking-widest">
                          <IconMapPin size={10} />
                          <span className="truncate">{f.location || 'Remote Node'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconExternalLink size={16} className="text-primary-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <Link to="/admin/facilities" className="flex items-center justify-between p-6 bg-white dark:bg-surface-900 border-2 border-dashed border-primary-100 dark:border-primary-800 text-primary-400 rounded-3xl hover:border-primary-900 hover:text-primary-900 transition-all group">
              <span className="text-[10px] font-black uppercase tracking-widest">Access Full Node Registry</span>
              <IconArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
