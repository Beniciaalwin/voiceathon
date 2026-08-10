import React from 'react';
import { Users, PhoneCall, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types/index';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Total Participants',
      value: stats?.totalLeads ?? 0,
      icon: Users,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100/80',
      badge: 'Hackathon roster',
    },
    {
      title: 'Calls Completed',
      value: stats?.callsCompleted ?? 0,
      icon: PhoneCall,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: 'AI Outbound calls',
    },
    {
      title: 'Follow-ups Pending',
      value: stats?.followupsPending ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      badge: 'Confirmation needed',
    },
    {
      title: 'Confirmed Participants',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: 'Ready for Hackathon',
    },
    {
      title: 'Failed Calls',
      value: stats?.failedCalls ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      badge: 'Invalid or unreachable',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 my-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-subtle hover:shadow-premium transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 tracking-tight">{card.title}</span>
              <div className={`w-7 h-7 rounded-lg ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              {loading ? (
                <div className="h-7 w-12 bg-gray-100 animate-pulse rounded-md"></div>
              ) : (
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                  {card.value.toLocaleString()}
                </span>
              )}
              <span className="text-[10px] text-gray-400 font-normal">{card.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
