import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, Bot, CheckCircle2, XCircle, HelpCircle, RefreshCw,
  FileText, Download, AlertTriangle, PhoneOff, Sparkles, Filter
} from 'lucide-react';

interface LLMParticipantResult {
  leadId: string;
  phone: string;
  participantName: string | null;
  callDropped: boolean;
  durationSeconds: number;
  interest: 'interested' | 'not_interested' | 'call_dropped' | 'unknown';
  phoneBought: 'yes' | 'no' | 'not_discussed';
  agentBuild: 'completed' | 'in_progress' | 'not_started' | 'not_discussed';
  willAttendEvent: 'yes' | 'no' | 'maybe' | 'not_discussed';
  keyInsight: string;
  followUpNeeded: boolean;
  confidence: 'high' | 'medium' | 'low';
}

interface AnalysisSummary {
  total: number;
  interested: number;
  notInterested: number;
  callDropped: number;
  phoneBought: number;
  agentCompleted: number;
  agentInProgress: number;
  needsFollowUp: number;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

function formatPhone(phone: string): string {
  if (!phone || phone.length < 10) return phone;
  return `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
}

function InterestBadge({ value }: { value: string }) {
  if (value === 'interested')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold"><CheckCircle2 className="w-3 h-3" /> Interested</span>;
  if (value === 'not_interested')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold"><XCircle className="w-3 h-3" /> Not Interested</span>;
  if (value === 'call_dropped')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold"><PhoneOff className="w-3 h-3" /> Call Dropped</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-medium"><HelpCircle className="w-3 h-3" /> Unknown</span>;
}

function PhoneBadge({ value }: { value: string }) {
  if (value === 'yes')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold"><CheckCircle2 className="w-3 h-3" /> Bought ✓</span>;
  if (value === 'no')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-500 text-[10px] font-medium"><XCircle className="w-3 h-3" /> Not Bought</span>;
  return <span className="text-[10px] text-gray-400">—</span>;
}

function AgentBadge({ value }: { value: string }) {
  if (value === 'completed')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold"><Bot className="w-3 h-3" /> Built ✓</span>;
  if (value === 'in_progress')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold"><Bot className="w-3 h-3" /> In Progress</span>;
  if (value === 'not_started')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-medium"><AlertTriangle className="w-3 h-3" /> Not Started</span>;
  return <span className="text-[10px] text-gray-400">—</span>;
}

function ConfidenceDot({ value }: { value: string }) {
  const colors: Record<string, string> = { high: 'bg-emerald-400', medium: 'bg-amber-400', low: 'bg-red-400' };
  return <span title={`LLM Confidence: ${value}`} className={`inline-block w-1.5 h-1.5 rounded-full ${colors[value] || 'bg-gray-300'}`} />;
}

function exportCSV(results: LLMParticipantResult[]) {
  const headers = ['Phone', 'Name', 'Interest', 'Phone Bought', 'Agent Build', 'Will Attend', 'Key Insight', 'Follow-up Needed', 'Call Duration (s)', 'Confidence'];
  const rows = results.map(r => [
    formatPhone(r.phone),
    r.participantName || '—',
    r.interest,
    r.phoneBought,
    r.agentBuild,
    r.willAttendEvent,
    `"${r.keyInsight.replace(/"/g, "'")}"`,
    r.followUpNeeded ? 'Yes' : 'No',
    r.durationSeconds,
    r.confidence,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voiceathon_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type FilterType = 'all' | 'interested' | 'phone_bought' | 'agent_built' | 'follow_up' | 'not_interested' | 'call_dropped';

export const ParticipantIntelPanel: React.FC = () => {
  const [results, setResults] = useState<LLMParticipantResult[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/analyze-calls`);
      if (!r.ok) throw new Error(`API error ${r.status}`);
      const json = await r.json();
      if (json.success) {
        setResults(json.results || []);
        setSummary(json.summary || null);
        setAnalyzed(true);
      } else {
        throw new Error(json.error || 'Analysis failed');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to analyze calls');
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = results.filter(r => {
    if (filter === 'interested') return r.interest === 'interested';
    if (filter === 'phone_bought') return r.phoneBought === 'yes';
    if (filter === 'agent_built') return r.agentBuild === 'completed' || r.agentBuild === 'in_progress';
    if (filter === 'follow_up') return r.followUpNeeded;
    if (filter === 'not_interested') return r.interest === 'not_interested';
    if (filter === 'call_dropped') return r.callDropped;
    return true;
  });

  const tabs: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: results.length, color: 'bg-gray-800 text-white' },
    { key: 'interested', label: '🟢 Interested', count: summary?.interested || 0, color: 'bg-emerald-600 text-white' },
    { key: 'phone_bought', label: '📞 Phone Bought', count: summary?.phoneBought || 0, color: 'bg-blue-600 text-white' },
    { key: 'agent_built', label: '🤖 Building', count: (summary?.agentCompleted || 0) + (summary?.agentInProgress || 0), color: 'bg-violet-600 text-white' },
    { key: 'follow_up', label: '⚡ Follow-up Needed', count: summary?.needsFollowUp || 0, color: 'bg-amber-600 text-white' },
    { key: 'not_interested', label: '🔴 Declined', count: summary?.notInterested || 0, color: 'bg-red-600 text-white' },
    { key: 'call_dropped', label: '📵 Dropped', count: summary?.callDropped || 0, color: 'bg-gray-600 text-white' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/70 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">🧠 LLM Participant Intelligence</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Groq AI reads each webhook JSON log → extracts real participant status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analyzed && (
            <button
              onClick={() => exportCSV(results)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Analyzing…' : analyzed ? 'Re-Analyze' : 'Run LLM Analysis'}
          </button>
        </div>
      </div>

      {/* Not yet run */}
      {!analyzed && !loading && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Run LLM Analysis</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Click "Run LLM Analysis" to have Groq AI read all webhook JSON logs and extract real participant status — who bought number, who built agent, who is interested.
          </p>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Groq AI analyzing webhook JSON logs…</p>
          <p className="text-xs text-gray-400 mt-1">Reading transcripts, LLM ticks & summaries for all participants</p>
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full max-w-xs mx-auto overflow-hidden">
            <div className="h-full bg-violet-400 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Results */}
      {analyzed && !loading && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
            {[
              { label: 'Total Analyzed', val: summary?.total || 0, color: 'text-gray-800' },
              { label: '📞 Phone Bought', val: summary?.phoneBought || 0, color: 'text-blue-700' },
              { label: '🤖 Agent Building', val: (summary?.agentCompleted || 0) + (summary?.agentInProgress || 0), color: 'text-violet-700' },
              { label: '⚡ Follow-up Needed', val: summary?.needsFollowUp || 0, color: 'text-amber-700' },
            ].map(s => (
              <div key={s.label} className="py-3 px-4 text-center border-r border-gray-100 last:border-r-0">
                <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                  filter === tab.key ? tab.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold ${filter === tab.key ? 'opacity-80' : 'text-gray-500'}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-4">Participant</th>
                  <th className="py-2.5 px-3">Interest</th>
                  <th className="py-2.5 px-3">📞 Phone</th>
                  <th className="py-2.5 px-3">🤖 Agent</th>
                  <th className="py-2.5 px-3">Will Attend</th>
                  <th className="py-2.5 px-4">Key Insight (LLM)</th>
                  <th className="py-2.5 px-3 text-center">Follow-up</th>
                  <th className="py-2.5 px-3 text-center">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-gray-400">No participants match this filter.</td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.leadId} className={`hover:bg-gray-50/80 transition-colors text-xs ${r.callDropped ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 font-mono text-[11px]">{formatPhone(r.phone)}</div>
                        {r.participantName && <div className="text-[10px] text-gray-500 mt-0.5">{r.participantName}</div>}
                        {r.callDropped && <div className="text-[10px] text-amber-600 mt-0.5">⚠️ {r.durationSeconds}s — dropped</div>}
                      </td>
                      <td className="py-3 px-3"><InterestBadge value={r.interest} /></td>
                      <td className="py-3 px-3"><PhoneBadge value={r.phoneBought} /></td>
                      <td className="py-3 px-3"><AgentBadge value={r.agentBuild} /></td>
                      <td className="py-3 px-3">
                        {r.willAttendEvent === 'yes' && <span className="text-emerald-600 font-semibold text-[11px]">✅ Yes</span>}
                        {r.willAttendEvent === 'no' && <span className="text-red-500 text-[11px]">❌ No</span>}
                        {r.willAttendEvent === 'maybe' && <span className="text-amber-600 text-[11px]">🤔 Maybe</span>}
                        {r.willAttendEvent === 'not_discussed' && <span className="text-gray-400 text-[10px]">—</span>}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{r.keyInsight}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.followUpNeeded
                          ? <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Follow-up needed" />
                          : <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />
                        }
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ConfidenceDot value={r.confidence} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Export Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              Analyzed by Groq llama-3.3-70b from raw webhook JSON logs · {results.length} participants
            </p>
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-[11px] font-semibold hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              <Download className="w-3 h-3" />
              Export {filter !== 'all' ? `(${filtered.length} filtered)` : 'All'} as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};
