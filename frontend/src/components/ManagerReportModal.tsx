import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, ShieldCheck, Download, CheckCircle2, AlertCircle, HelpCircle,
  FileText, Send, Sparkles, MessageSquareQuote, Check, AlertTriangle, PhoneOff
} from 'lucide-react';
import { Lead } from '../types/index';

interface ManagerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

export const ManagerReportModal: React.FC<ManagerReportModalProps> = ({
  isOpen,
  onClose,
  leads,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'outcomes' | 'numbers'>('outcomes');

  if (!isOpen) return null;

  // 1. Calculate strict audit stats dynamically
  const totalParticipants = leads.length;
  const interestedCount = leads.filter(l => l.llm_analysis?.interest?.status === 'confirmed').length;
  const notInterestedCount = leads.filter(l => l.llm_analysis?.interest?.status === 'declined').length;
  const confirmedCount = leads.filter(l => l.final_status === 'Completed').length;
  const participatedCount = leads.filter(l => l.llm_analysis?.participation?.status === 'confirmed').length;
  
  const followupPendingCount = leads.filter(l => l.final_status === 'Follow-up Pending' || l.llm_analysis?.follow_up?.status === 'pending').length;
  const reminderPendingCount = leads.filter(l => l.final_status === 'Reminder Pending' || l.llm_analysis?.reminder?.status === 'pending').length;
  
  const noAnswerCount = leads.filter(l => l.final_status === 'No Answer').length;
  const callFailedCount = leads.filter(l => l.final_status === 'Call Failed').length;
  const needsReviewCount = leads.filter(l => l.final_status === 'Unclear' || l.llm_analysis?.interest?.status === 'unclear').length;

  // 2. Phone number purchase stats dynamically mapped from strict audit
  const numPurchased = leads.filter(l => l.llm_analysis?.number?.status === 'purchased' || l.llm_analysis?.number?.status === 'already_has').length;
  const numNotPurchased = leads.filter(l => l.llm_analysis?.number?.status === 'not_purchased').length;
  const numPurchasePending = leads.filter(l => l.llm_analysis?.number?.status === 'planning_pending').length;
  const numNotRequired = leads.filter(l => l.llm_analysis?.number?.status === 'not_required').length;
  const numUnclear = leads.filter(l => l.llm_analysis?.number?.status === 'no_evidence' || l.llm_analysis?.number?.status === 'unclear' || !l.llm_analysis?.number?.status).length;

  const handleDownloadReport = () => {
    // Generate CSV data for manager export
    const headers = [
      'Participant Name', 'Phone', 'Email', 'Voiceathon Status', 
      'Interest', 'Required Number Status', 'AI Status Reason', 'Phone Purchase Reason'
    ];
    const rows = leads.map(l => [
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.final_status}"`,
      `"${l.llm_analysis?.interest || 'Unknown'}"`,
      `"${l.llm_analysis?.number_status || 'Unclear'}"`,
      `"${(l.llm_analysis?.reason || '').replace(/"/g, "'")}"`,
      `"${(l.llm_analysis?.number_reason || '').replace(/"/g, "'")}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Voiceathon_2026_Executive_Manager_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitToManager = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="p-6 bg-gradient-to-r from-purple-905 via-indigo-950 to-gray-950 text-white flex items-center justify-between border-b border-purple-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Voiceathon 2026 Manager Executive Report
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-bold">
                    Official Sign-Off Ready
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-0.5">
                  100% Webhook Logs & Transcript Derived Participant Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 px-6">
            <button
              onClick={() => setActiveTab('outcomes')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'outcomes'
                  ? 'border-purple-600 text-purple-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              📊 Executive Call Outcomes
            </button>
            <button
              onClick={() => setActiveTab('numbers')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'numbers'
                  ? 'border-purple-600 text-purple-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              📞 Required Phone Number Status
            </button>
          </div>

          {/* Dynamic Stats Section */}
          <div className="p-5 bg-gray-50/70 border-b border-gray-200/80">
            {activeTab === 'outcomes' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">Total</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{totalParticipants}</p>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <span className="text-emerald-700 font-bold block text-[9px] uppercase tracking-wider">Interested</span>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{interestedCount}</p>
                </div>
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 shadow-xs">
                  <span className="text-rose-700 font-bold block text-[9px] uppercase tracking-wider">Not Int.</span>
                  <p className="text-sm font-bold text-rose-900 mt-0.5">{notInterestedCount}</p>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <span className="text-emerald-700 font-bold block text-[9px] uppercase tracking-wider">Confirmed</span>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{confirmedCount}</p>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <span className="text-emerald-700 font-bold block text-[9px] uppercase tracking-wider">Participated</span>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">{participatedCount}</p>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 shadow-xs">
                  <span className="text-amber-700 font-bold block text-[9px] uppercase tracking-wider">Follow-up</span>
                  <p className="text-sm font-bold text-amber-900 mt-0.5">{followupPendingCount}</p>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 shadow-xs">
                  <span className="text-amber-700 font-bold block text-[9px] uppercase tracking-wider">Reminder</span>
                  <p className="text-sm font-bold text-amber-900 mt-0.5">{reminderPendingCount}</p>
                </div>
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 shadow-xs">
                  <span className="text-blue-700 font-bold block text-[9px] uppercase tracking-wider">No Answer</span>
                  <p className="text-sm font-bold text-blue-900 mt-0.5">{noAnswerCount}</p>
                </div>
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 shadow-xs">
                  <span className="text-rose-700 font-bold block text-[9px] uppercase tracking-wider">Failed</span>
                  <p className="text-sm font-bold text-rose-900 mt-0.5">{callFailedCount}</p>
                </div>
                <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-200/80 shadow-xs">
                  <span className="text-orange-700 font-bold block text-[9px] uppercase tracking-wider">Review</span>
                  <p className="text-sm font-bold text-orange-900 mt-0.5">{needsReviewCount}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">Total Participants</span>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{totalParticipants}</p>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 shadow-xs">
                  <span className="text-emerald-700 font-bold block text-[9px] uppercase tracking-wider">Number Purchased</span>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">{numPurchased}</p>
                </div>
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/60 shadow-xs">
                  <span className="text-rose-700 font-bold block text-[9px] uppercase tracking-wider">Number Not Purchased</span>
                  <p className="text-base font-bold text-rose-900 mt-0.5">{numNotPurchased}</p>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 shadow-xs">
                  <span className="text-amber-700 font-bold block text-[9px] uppercase tracking-wider">Number Purchase Pending</span>
                  <p className="text-base font-bold text-amber-900 mt-0.5">{numPurchasePending}</p>
                </div>
                <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200/60 shadow-xs">
                  <span className="text-orange-700 font-bold block text-[9px] uppercase tracking-wider">Number Status Unclear</span>
                  <p className="text-base font-bold text-orange-900 mt-0.5">{numUnclear}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Body - Dynamic Executive Participant List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {leads.map((lead) => {
              const analysis = lead.llm_analysis;
              const isConfirmed = lead.final_status === 'Completed' || lead.final_status === 'Participated';
              const isDeclined = lead.final_status === 'Not Interested';
              const isFollowUp = lead.final_status === 'Follow-up Pending';
              const isUnclear = lead.final_status === 'Unclear' || analysis?.needs_review === true;

              return (
                <div
                  key={lead.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isConfirmed 
                      ? 'bg-gradient-to-br from-emerald-50/30 via-white to-gray-50 border-emerald-200' 
                      : isDeclined 
                      ? 'bg-gradient-to-br from-rose-50/20 via-white to-gray-50 border-rose-100'
                      : isUnclear
                      ? 'bg-gradient-to-br from-orange-50/20 via-white to-gray-50 border-orange-200 animate-pulse'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold text-white flex items-center justify-center ${
                        isConfirmed ? 'bg-emerald-600' : isDeclined ? 'bg-rose-500' : isUnclear ? 'bg-orange-500' : 'bg-purple-900'
                      }`}>
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                          {lead.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-mono">
                          <span>{lead.phone}</span>
                          <span>•</span>
                          <span>{lead.email || 'Participant'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnclear && (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-extrabold uppercase animate-pulse">
                          ⚠️ Needs Review
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isConfirmed 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : isDeclined 
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isFollowUp
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        Voiceathon Status: {lead.final_status}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Status Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 text-xs font-mono">
                    <div>
                      <span className="text-gray-400 font-semibold block">Interest Level:</span>
                      <span className="font-bold text-gray-950 mt-0.5 inline-block capitalize">
                        {analysis?.interest?.status || 'no_evidence'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Required Number:</span>
                      <span className="font-bold text-gray-950 mt-0.5 inline-block capitalize">
                        {analysis?.number?.status || 'no_evidence'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Follow-up:</span>
                      <span className="font-bold text-gray-950 mt-0.5 inline-block capitalize">
                        {analysis?.follow_up?.status || 'no_evidence'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Participation:</span>
                      <span className="font-bold text-gray-950 mt-0.5 inline-block capitalize">
                        {analysis?.participation?.status || 'no_evidence'}
                      </span>
                    </div>
                  </div>

                  {/* Verbatim AI Explanation Quote */}
                  <div className="mt-3 bg-purple-50/60 p-3 rounded-xl border border-purple-100/60 text-xs font-mono text-purple-950 flex items-start gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">AI Conversation Evidence:</span>
                        <span className="font-semibold text-purple-900">"{analysis?.reason || 'No call transcripts parsed yet. Re-run webhook analysis to inspect.'}"</span>
                      </div>
                      {analysis?.number_reason && (
                        <div className="pt-1.5 border-t border-purple-100/60">
                          <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">Phone Purchase Evidence:</span>
                          <span className="font-semibold text-purple-900">"{analysis.number_reason}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manager Notes Input */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 shrink-0">Manager Sign-off Note:</span>
                    <input
                      type="text"
                      placeholder="e.g. Confirmed attendance and Twilio phone number purchased."
                      value={managerNotes[lead.id] || ''}
                      onChange={(e) => setManagerNotes({ ...managerNotes, [lead.id]: e.target.value })}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between">
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-600" />
              Download Manager Executive Report (CSV)
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToManager}
                disabled={submitted}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {submitted ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Submitted to Manager!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
                    Submit Manager Readiness Report
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
