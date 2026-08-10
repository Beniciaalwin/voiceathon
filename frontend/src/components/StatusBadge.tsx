import React from 'react';
import { ActivityStatus, FinalStatus } from '../types/index';

interface StatusBadgeProps {
  status: ActivityStatus | string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let icon = '—';
  let colorClasses = 'bg-gray-100 text-gray-400 border-gray-200';
  let tooltipText = 'Not Started / N/A';

  switch (status) {
    case 'completed':
    case 'Completed':
      icon = '✓';
      colorClasses = 'bg-emerald-50 text-emerald-600 border-emerald-200/80 font-bold';
      tooltipText = 'Completed';
      break;
    case 'pending':
    case 'Follow-up Pending':
    case 'Follow-up Scheduled':
    case 'Reminder Pending':
    case 'Calling':
      icon = '◷';
      colorClasses = 'bg-amber-50 text-amber-600 border-amber-200/80 font-bold';
      tooltipText = 'In Progress / Pending';
      break;
    case 'failed':
    case 'Call Failed':
    case 'Invalid Number':
      icon = '!';
      colorClasses = 'bg-rose-50 text-rose-600 border-rose-200/80 font-extrabold';
      tooltipText = 'Failed';
      break;
    case 'not_started':
    case 'Not Started':
    default:
      icon = '—';
      colorClasses = 'bg-gray-50 text-gray-400 border-gray-200/60 font-medium';
      tooltipText = 'Not Started';
      break;
  }

  const dimension = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs';

  return (
    <div className="relative group inline-flex items-center justify-center">
      <span
        className={`inline-flex items-center justify-center rounded-lg border transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm ${dimension} ${colorClasses}`}
      >
        {icon}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none transition-all duration-200">
        <div className="bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {icon} {tooltipText}
        </div>
        <div className="w-2 h-2 -mt-1 bg-gray-900 rotate-45"></div>
      </div>
    </div>
  );
};

export const FinalStatusPill: React.FC<{ status: FinalStatus }> = ({ status }) => {
  let style = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotColor = 'bg-gray-400';

  switch (status) {
    case 'Completed':
    case 'Participated':
      style = 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60';
      dotColor = 'bg-emerald-500';
      break;
    case 'Follow-up Pending':
    case 'Follow-up Scheduled':
    case 'Reminder Pending':
      style = 'bg-amber-50/80 text-amber-700 border-amber-200/60';
      dotColor = 'bg-amber-500';
      break;
    case 'Calling':
      style = 'bg-blue-50/80 text-blue-700 border-blue-200/60';
      dotColor = 'bg-blue-500 animate-pulse';
      break;
    case 'Call Failed':
    case 'Invalid Number':
      style = 'bg-rose-50/80 text-rose-700 border-rose-200/60';
      dotColor = 'bg-rose-500';
      break;
    case 'Not Started':
    default:
      style = 'bg-gray-50 text-gray-600 border-gray-200/60';
      dotColor = 'bg-gray-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium transition-colors ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
