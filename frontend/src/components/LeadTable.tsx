import React from 'react';
import { Lead } from '../types/index';
import { StatusBadge, FinalStatusPill } from './StatusBadge';
import { Clock, Phone, Mail, UserCheck, CalendarDays } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  onSelectLead: (lead: Lead) => void;
  selectedLeadId?: string;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  loading,
  onSelectLead,
  selectedLeadId,
}) => {
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSequenceStage = (lead: Lead) => {
    if (lead.final_status === 'Completed' || lead.participated_status === 'completed') {
      return { step: '5/5', label: 'Day 8: Agent 5 (Feedback)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (lead.reminder_status === 'completed' || lead.reminder_status === 'pending') {
      return { step: '4/5', label: 'Day 7: Agent 4 (Reminder)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (lead.followup_status === 'completed' || lead.followup_status === 'pending') {
      return { step: '3/5', label: 'Day 5: Agent 3 (Confirmation)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (lead.cold_call_status === 'completed') {
      return { step: '2/5', label: 'Day 3: Agent 2 (Tech Check)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (lead.agent_status === 'completed') {
      return { step: '1/5', label: 'Day 1: Agent 1 (Registration)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { step: '0/5', label: 'Day 0: Pending Agent 1', color: 'bg-gray-50 text-gray-500 border-gray-200' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-subtle p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-100/70 animate-pulse rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-subtle p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">No participants found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          No participant records match your active search filter or multi-day sequence track.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-subtle overflow-hidden transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Participant Name</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Multi-Day Journey</th>
              <th className="py-3 px-2 text-center" title="Day 1: Agent 1">A1 (D1)</th>
              <th className="py-3 px-2 text-center" title="Day 3: Agent 2">A2 (D3)</th>
              <th className="py-3 px-2 text-center" title="Day 5: Agent 3">A3 (D5)</th>
              <th className="py-3 px-2 text-center" title="Day 7: Agent 4">A4 (D7)</th>
              <th className="py-3 px-2 text-center" title="Day 8: Agent 5">A5 (D8)</th>
              <th className="py-3 px-4">Final Status</th>
              <th className="py-3 px-4 text-right">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const sequence = getSequenceStage(lead);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    isSelected ? 'bg-purple-50/50 hover:bg-purple-50' : 'hover:bg-gray-50/80'
                  }`}
                >
                  {/* Participant Name */}
                  <td className="py-3.5 px-4 font-semibold text-gray-900 group-hover:text-black transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-semibold text-xs flex items-center justify-center">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div>{lead.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono font-normal">{lead.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{lead.phone}</span>
                    </div>
                  </td>

                  {/* Multi-Day Journey Pill */}
                  <td className="py-3.5 px-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${sequence.color}`}>
                      <CalendarDays className="w-3 h-3" />
                      <span>{sequence.label}</span>
                    </div>
                  </td>

                  {/* 5 Multi-Day Agent Sequence Grid */}
                  <td className="py-3.5 px-2 text-center" title="Day 1: Agent 1 (Registration)">
                    <StatusBadge status={lead.agent_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-2 text-center" title="Day 3: Agent 2 (Tech Screening)">
                    <StatusBadge status={lead.cold_call_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-2 text-center" title="Day 5: Agent 3 (Confirmation)">
                    <StatusBadge status={lead.followup_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-2 text-center" title="Day 7: Agent 4 (Reminder)">
                    <StatusBadge status={lead.reminder_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-2 text-center" title="Day 8: Agent 5 (Feedback)">
                    <StatusBadge status={lead.email_status} size="sm" />
                  </td>

                  {/* Final Status */}
                  <td className="py-3.5 px-4">
                    <FinalStatusPill status={lead.final_status} />
                  </td>

                  {/* Last Activity */}
                  <td className="py-3.5 px-4 text-right text-gray-500 font-mono text-[11px]">
                    <div className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{formatTimeAgo(lead.last_activity)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
