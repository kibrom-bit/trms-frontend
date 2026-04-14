import React from 'react';
import { StatBanner } from './StatBanner';
import { Referral, ReferralStatus } from '../../../types/api';

interface LiaisonSummaryCardsProps {
  referrals: Referral[];
}

export function LiaisonSummaryCards({ referrals }: LiaisonSummaryCardsProps) {
  // Today's summary counts
  const today = new Date().toISOString().split('T')[0];
  
  const todayReferrals = referrals.filter(r => r.createdAt?.split('T')[0] === today);
  
  const stats = [
    { 
      label: 'Received Today', 
      value: todayReferrals.length, 
      trend: todayReferrals.length > 0 ? 'Active Queue' : 'Quiet Day', 
      trendColor: 'default' as const 
    },
    { 
      label: 'Accepted Today', 
      value: todayReferrals.filter(r => r.status === 'accepted').length, 
      trend: 'To Departments', 
      trendColor: 'success' as const 
    },
    { 
      label: 'Rejected / Refused', 
      value: todayReferrals.filter(r => r.status === 'rejected').length, 
      trend: 'With Reason', 
      trendColor: 'error' as const 
    },
    { 
      label: 'Forwarded Out', 
      value: todayReferrals.filter(r => r.status === 'forwarded').length, 
      trend: 'Network Routing', 
      trendColor: 'warning' as const 
    },
  ];

  return <StatBanner stats={stats} />;
}
