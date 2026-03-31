import React from 'react';

interface Stat {
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: 'success' | 'error' | 'warning' | 'default';
}

interface StatBannerProps {
  stats: Stat[];
}

export function StatBanner({ stats }: StatBannerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">{stat.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-900 dark:text-white uppercase tracking-tighter">
              {stat.value}
            </span>
            {stat.trend && (
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                stat.trendColor === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                stat.trendColor === 'error' ? 'text-red-600 dark:text-red-400' :
                stat.trendColor === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                'text-primary-400'
              }`}>
                {stat.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
