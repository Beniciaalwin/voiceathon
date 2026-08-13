import React from 'react';
import { Lead } from '../types/index';
import { StatusBadge, FinalStatusPill } from './StatusBadge';
import { Phone, Mail, UserCheck } from 'lucide-react';

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
          No participant records match your active search filter or webhook database ticks.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-subtle overflow-hidden transition-all">
      <div className="overflow-x-auto font-sans">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-2 text-center" title="Day 1: Agent Welcome Call">Agent</th>
              <th className="py-3 px-2 text-center" title="Day 3: Cold Call Screening">Cold Call</th>
              <th className="py-3 px-2 text-center" title="Day 5: Follow-up Callback">Follow-up</th>
              <th className="py-3 px-2 text-center" title="Day 7: Deadline Reminder">Reminder</th>
              <th className="py-3 px-2 text-center" title="Required Item / Phone Number status">Number</th>
              <th className="py-3 px-2 text-center" title="Participation confirmed status">Participated</th>
              <th className="py-3 px-2 text-center" title="Day 8: Confirmation Email">Email</th>
              <th className="py-3 px-4">Voiceathon Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;

              // Check if name is generic (Participant (XXX))
              const isGenericName = /^Participant\s*\(/i.test(lead.name) || !lead.name || lead.name.trim() === '';
              const formattedPhone = lead.phone
                ? `+${lead.phone.replace(/\D/g, '')}`
                : '—';
              const displayName = isGenericName ? formattedPhone : lead.name;
              const displayAvatar = isGenericName ? '📞' : lead.name.charAt(0).toUpperCase();

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    isSelected ? 'bg-purple-50/50 hover:bg-purple-50' : 'hover:bg-gray-50/80'
                  }`}
                >
                  {/* Name */}
                  <td className="py-3.5 px-4 font-semibold text-gray-900 group-hover:text-black transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full border text-[11px] flex items-center justify-center font-bold shrink-0 ${
                        isGenericName
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>
                        {displayAvatar}
                      </div>
                      <span className="truncate max-w-[140px] block" title={displayName}>
                        {displayName}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px] truncate max-w-[120px]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{formattedPhone}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px] truncate max-w-[140px]" title={lead.email}>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{lead.email || '—'}</span>
                    </div>
                  </td>

                  {/* Agent */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.agent_status} size="sm" />
                  </td>

                  {/* Cold Call */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.cold_call_status} size="sm" />
                  </td>

                  {/* Follow-up */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.followup_status} size="sm" />
                  </td>

                  {/* Reminder */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.reminder_status} size="sm" />
                  </td>

                  {/* Number */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.number_status} size="sm" />
                  </td>

                  {/* Participated */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.participated_status} size="sm" />
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-2 text-center">
                    <StatusBadge status={lead.email_status} size="sm" />
                  </td>

                  {/* Voiceathon Status */}
                  <td className="py-3.5 px-4 shrink-0">
                    <FinalStatusPill status={lead.final_status} />
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
