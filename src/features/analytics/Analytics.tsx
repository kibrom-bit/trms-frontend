import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Referral } from '../../types/api';
import { StatBanner } from '../dashboard/components/StatBanner';
import { 
  IconChartBar, 
  IconChartArea, 
  IconChartPie, 
  IconUsers,
  IconArrowRight,
  IconDownload
} from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';

export default function Analytics() {
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const response = await apiClient.get<Referral[]>('/referrals');
      return response.data;
    },
  });

  // Simple aggregations for demonstration
  const total = referrals?.length || 0;
  const emergency = referrals?.filter(r => r.priority === 'emergency').length || 0;
  const accepted = referrals?.filter(r => r.status === 'accepted' || r.status === 'completed').length || 0;
  const acceptedRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

  const stats = [
    { label: 'Total Throughput', value: total, trend: 'Past 30 Days', trendColor: 'default' as const },
    { label: 'Network Acceptance', value: `${acceptedRate}%`, trend: '+2.4% vs last mo', trendColor: 'success' as const },
    { label: 'Emergency Load', value: emergency, trend: 'Require Priority', trendColor: 'error' as const },
    { label: 'Avg Triage Delay', value: '22m', trend: '-18% vs target', trendColor: 'success' as const },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-primary-900 dark:text-white">
            Regional Health Analytics
          </h1>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
            Network Performance & Referral Trends
          </p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <IconDownload size={16} />
          Export System Report
        </Button>
      </div>

      <StatBanner stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Status Distribution */}
        <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-primary-100 text-primary-900 flex items-center justify-center dark:bg-primary-800 dark:text-primary-100 uppercase font-black text-[10px]">%</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white">Referral Decision Outcomes</h3>
          </div>
          <div className="space-y-4">
            {['accepted', 'rejected', 'pending', 'forwarded'].map((status) => {
              const count = referrals?.filter(r => r.status === status).length || 0;
              const percent = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-primary-500">{status}</span>
                    <span className="text-primary-900 dark:text-white">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-primary-50 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-900 dark:bg-primary-700 transition-all duration-1000" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Load */}
        <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center dark:bg-red-900/30 dark:text-red-400">
              <IconChartBar size={18} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white">Priority Distribution</h3>
          </div>
          <div className="flex items-center justify-around h-48 py-4">
            {['routine', 'urgent', 'emergency'].map((p) => {
              const count = referrals?.filter(r => r.priority === p).length || 0;
              const height = total > 0 ? (count / total) * 100 : 0;
              const color = p === 'emergency' ? 'bg-red-500' : p === 'urgent' ? 'bg-amber-500' : 'bg-blue-500';
              return (
                <div key={p} className="flex flex-col items-center justify-end h-full gap-3 group">
                   <div className="text-[10px] font-black group-hover:block transition-all opacity-0 group-hover:opacity-100">{count}</div>
                   <div className={`w-8 ${color} rounded-t transition-all duration-700`} style={{ height: `${Math.max(5, height)}%` }} />
                   <span className="text-[9px] font-bold uppercase tracking-tighter text-primary-400">{p}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network Efficiency Table */}
      <div className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded p-6 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary-900 dark:text-white mb-6">Network Efficiency Matrix</h3>
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest">
           <thead className="text-primary-400 border-b border-primary-50 dark:border-primary-800">
              <tr>
                <th className="py-3">Facility Node</th>
                <th className="py-3">Inbound Count</th>
                <th className="py-3">Outbound Count</th>
                <th className="py-3">Avg Response</th>
                <th className="py-3">Efficiency Score</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-primary-50 dark:divide-primary-800 text-primary-700 dark:text-primary-300">
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="hover:bg-primary-50/50 dark:hover:bg-surface-800 transition-colors">
                  <td className="py-4 text-primary-900 dark:text-white font-black">Ayder Referral Node {i}</td>
                  <td className="py-4">{Math.floor(Math.random() * 50)}</td>
                  <td className="py-4">{Math.floor(Math.random() * 50)}</td>
                  <td className="py-4 font-mono">14m 2{i}s</td>
                  <td className="py-4 flex items-center gap-2">
                    <span className="w-12 h-1 bg-emerald-500 rounded-full" />
                    9{i}%
                  </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
