import React, { useState, useEffect } from 'react';
import { Phone, Bot, CheckCircle2, XCircle, HelpCircle, User, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ParticipantIntel {
  leadId: string;
  phone: string;
  formattedPhone: string;
  displayName: string | null;
  phoneBought: string;
  agentBuild: string;
  summarySnippet: string;
  callTime: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function TickBadge({ value, label }: { value: string; label: string }) {
  const isVerified = value === 'verified' || value === 'true';
  const isNotYet = value === 'not_yet' || value === 'false';
  const isNotAsked = value === 'not_asked';

  if (isVerified)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
        <CheckCircle2 className="w-3 h-3" /> {label}
      </span>
    );
  if (isNotYet)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold">
        <XCircle className="w-3 h-3" /> Not Yet
      </span>
    );
  if (isNotAsked)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 text-[10px] font-medium">
        <HelpCircle className="w-3 h-3" /> Not Asked
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-medium">
      <HelpCircle className="w-3 h-3" /> Unknown
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const ParticipantIntelPanel: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'phone' | 'agent' | 'none'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/participant-intel`);
      const json = await r.json();
      if (json.success) setParticipants(json.participants || []);
    } catch (e) {
      console.error('participant-intel fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = participants.filter(p => {
    if (filter === 'phone') return p.phoneBought === 'verified';
    if (filter === 'agent') return p.agentBuild === 'verified';
    if (filter === 'none') return p.phoneBought !== 'verified' && p.agentBuild !== 'verified';
    return true;
  });

  const phoneBoughtCount = participants.filter(p => p.phoneBought === 'verified').length;
  const agentBuiltCount = participants.filter(p => p.agentBuild === 'verified').length;
  const neitherCount = participants.filter(p => p.phoneBought !== 'verified' && p.agentBuild !== 'verified').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-white">
        <div>
          <h2 className="text-sm font-bold text-gray-900">📋 Participant Intelligence</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Live summary from AI call notes — who bought number, who built agent
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-all text-gray-500 disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Stat Tabs */}
      <div className="grid grid-cols-4 gap-0 border-b border-gray-100 text-[11px]">
        {[
          { label: 'All Participants', count: participants.length, key: 'all', color: 'text-indigo-700 bg-indigo-50', activeColor: 'border-b-2 border-indigo-500' },
          { label: '📞 Phone Bought', count: phoneBoughtCount, key: 'phone', color: 'text-emerald-700 bg-emerald-50', activeColor: 'border-b-2 border-emerald-500' },
          { label: '🤖 Agent Built', count: agentBuiltCount, key: 'agent', color: 'text-violet-700 bg-violet-50', activeColor: 'border-b-2 border-violet-500' },
          { label: '⏳ No Action Yet', count: neitherCount, key: 'none', color: 'text-amber-700 bg-amber-50', activeColor: 'border-b-2 border-amber-400' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`py-3 px-2 text-center font-semibold transition-all hover:bg-gray-50 ${filter === tab.key ? tab.activeColor : 'border-b-2 border-transparent'}`}
          >
            <div className={`text-lg font-bold ${filter === tab.key ? tab.color.split(' ')[0] : 'text-gray-800'}`}>{tab.count}</div>
            <div className="text-gray-500 font-medium">{tab.label}</div>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Loading participant intelligence…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No participants found for this filter.</div>
        ) : (
          filtered.map(p => {
            const isExpanded = expanded === p.leadId;
            const hasPhone = p.phoneBought === 'verified';
            const hasAgent = p.agentBuild === 'verified';
            const isHero = hasPhone && hasAgent;

            return (
              <div
                key={p.leadId}
                className={`transition-colors ${isHero ? 'bg-emerald-50/30' : ''}`}
              >
                <div
                  className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : p.leadId)}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    p.displayName ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {p.displayName ? p.displayName.charAt(0).toUpperCase() : '📞'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.displayName ? (
                          <span className="font-semibold text-gray-900 text-xs">{p.displayName}</span>
                        ) : (
                          <span className="font-mono text-xs text-gray-700 font-semibold">{p.formattedPhone}</span>
                        )}
                        {p.displayName && (
                          <span className="font-mono text-[10px] text-gray-400">{p.formattedPhone}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(p.callTime)}</span>
                    </div>

                    {/* Ticks row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <TickBadge value={p.phoneBought} label="Number Bought" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Bot className="w-3 h-3 text-gray-400" />
                        <TickBadge value={p.agentBuild} label="Agent Built" />
                      </div>
                    </div>

                    {/* Summary snippet */}
                    <p className={`text-[11px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2 ${isExpanded ? 'line-clamp-none' : ''}`}>
                      {p.summarySnippet}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
