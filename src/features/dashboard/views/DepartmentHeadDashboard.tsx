import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { Referral, User, UserRole, ReferralStatus } from '../../../types/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { 
  IconUsersGroup, IconStethoscope, IconClipboardList, 
  IconTrendingUp, IconAlertTriangle, IconCircleCheck, 
  IconHourglassLow, IconArrowUpRight, IconFileExport,
  IconChartPie, IconActivity, IconClock
} from '@tabler/icons-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title 
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function DepartmentHeadDashboard() {
  const { user } = useAuth();

  /* ── DATA FETCHING ── */
  const { data: deptReferrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['dept-referrals', user?.departmentId],
    queryFn: async () => {
      const r = await apiClient.get<Referral[]>(`/referrals?departmentId=${user?.departmentId}`);
      return r.data;
    },
    enabled: !!user?.departmentId,
  });

  const { data: deptClinicians = [], isLoading: cliniciansLoading } = useQuery({
    queryKey: ['dept-clinicians', user?.departmentId],
    queryFn: async () => {
      const r = await apiClient.get<User[]>(`/users?departmentId=${user?.departmentId}`);
      return r.data;
    },
    enabled: !!user?.departmentId,
  });

  /* ── ANALYTICS CALCULATION ── */
  const analytics = useMemo(() => {
    const total = deptReferrals.length;
    const accepted = deptReferrals.filter(r => r.status === 'accepted').length;
    const rejected = deptReferrals.filter(r => r.status === 'rejected').length;
    const forwarded = deptReferrals.filter(r => r.status === 'forwarded').length;
    const completed = deptReferrals.filter(r => r.status === 'completed').length;
    
    // Feedback Rate: (Completed / Accepted) * 100
    const feedbackRate = accepted > 0 ? Math.round((completed / (accepted + completed)) * 100) : 0;
    
    // Active Doctors (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDoctors = deptClinicians.filter(c => 
      c.role === UserRole.DOCTOR && 
      c.active && 
      (c.lastLogin ? new Date(c.lastLogin) > oneDayAgo : false)
    ).length;

    return { total, accepted, rejected, forwarded, completed, feedbackRate, activeDoctors };
  }, [deptReferrals, deptClinicians]);

  const chartData = {
    labels: ['Accepted', 'Rejected', 'Forwarded', 'Completed'],
    datasets: [{
      data: [analytics.accepted, analytics.rejected, analytics.forwarded, analytics.completed],
      backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
      borderWidth: 0,
      hoverOffset: 15,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, font: { weight: 'bold' as any, size: 10 } } },
      tooltip: { cornerRadius: 12, padding: 12, titleFont: { size: 14 } }
    },
    maintainAspectRatio: false,
  };

  if (referralsLoading || cliniciansLoading) {
    return <div className="p-8 space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-primary-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4"><div className="h-24 bg-primary-50 rounded-2xl" /><div className="h-24 bg-primary-50 rounded-2xl" /><div className="h-24 bg-primary-50 rounded-2xl" /><div className="h-24 bg-primary-50 rounded-2xl" /></div>
      <div className="h-96 bg-primary-50 rounded-[3rem]" />
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-primary-900 leading-none mb-2">Clinical Engine</h2>
          <p className="text-sm font-black text-primary-600 uppercase tracking-[0.2em]">{user?.departmentName || 'Leadership Oversight Dashboard'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" className="rounded-2xl"><IconFileExport size={16} /> Export Monthly</Button>
          <Link to="/admin/departments">
            <Button size="sm" className="rounded-2xl bg-primary-900 text-white"><IconClipboardList size={16} /> Triage Center</Button>
          </Link>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Total Received" value={analytics.total} color="text-primary-900" bg="bg-primary-50" icon={IconActivity} />
         <MetricCard label="Feedback Rate" value={`${analytics.feedbackRate}%`} color="text-emerald-600" bg="bg-emerald-50" icon={IconTrendingUp} trend="+5%" />
         <MetricCard label="Wait-Time Avg" value="2.4h" color="text-amber-600" bg="bg-amber-50" icon={IconClock} />
         <MetricCard label="Active Personnel" value={analytics.activeDoctors} color="text-blue-600" bg="bg-blue-50" icon={IconUsersGroup} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* OUTCOME PIE CHART */}
        <div className="lg:col-span-1 p-8 rounded-[3rem] bg-white border-2 border-primary-50 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 mb-8 flex items-center gap-2"><IconChartPie size={16} /> Referral Distribution</h3>
          <div className="flex-1 relative">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* RECENT QUEUE MONITOR */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary-900">Live Intake Monitor</h3>
             <Link to="/admin/departments" className="text-[10px] font-black text-primary-600 hover:text-primary-900 uppercase underline tracking-widest">View Full Registry</Link>
          </div>
          <div className="bg-white rounded-[3rem] border-2 border-primary-50 overflow-hidden shadow-sm h-[400px]">
             {deptReferrals.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-primary-200">
                  <IconStethoscope size={64} className="mb-2" />
                  <p className="font-black uppercase tracking-widest text-xs">No referrals currently active</p>
               </div>
             ) : (
               <div className="divide-y divide-primary-50">
                  {deptReferrals.slice(0, 5).map(r => (
                    <div key={r.id} className="p-6 flex items-center justify-between hover:bg-primary-50/30 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${r.priority === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                              {(r.patientName || 'P').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-primary-900 uppercase">{r.patientName}</p>
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest inline-flex items-center gap-1">
                               <IconHourglassLow size={10} /> {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                       </div>
                        <div className="flex items-center gap-4">
                           <Badge label={(r.status || 'pending').replace('_', ' ')} />
                           <IconArrowUpRight size={18} className="text-primary-100" />
                        </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
          <div className="p-6 rounded-[2rem] bg-indigo-950 text-white flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><IconUsersGroup size={24} /></div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest">Clinician Management</p>
                   <p className="text-[10px] opacity-70 uppercase font-bold tracking-tight">Onboard, Reset Keys, and Manage Access</p>
                </div>
             </div>
             <Link to="/department/staff">
                <Button variant="secondary" size="sm" className="rounded-xl px-6">Manage Staff</Button>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, bg, icon: Icon, trend }: { label: string; value: string | number; color: string; bg: string; icon: any; trend?: string }) {
  return (
    <div className={`p-8 rounded-[2.5rem] ${bg} border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group backdrop-blur-md`}>
       <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 ${color.replace('text-', 'text-opacity-20 ')}`}>
          <Icon size={100} />
       </div>
       <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2 group-hover:text-primary-900 transition-colors">{label}</p>
          <div className="flex items-baseline gap-3">
             <p className={`text-4xl font-black tracking-tight leading-none ${color}`}>{value}</p>
             {trend && (
               <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase">
                 <IconTrendingUp size={10} /> {trend}
               </div>
             )}
          </div>
       </div>
    </div>
  );
}
