import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Clock, CalendarDays, FileText, CheckCircle2, AlertCircle, Bot, MessageSquare, Trophy, Layers, Check, ChevronRight } from 'lucide-react';
import { Lead, CallLog, Activity } from '../types/index';
import { fetchLeadCalls, fetchLeadActivities } from '../lib/api';
import { StatusBadge, FinalStatusPill } from './StatusBadge';

interface CandidateDrawerProps {
  lead: Lead | null;
  onClose: () => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ lead, onClose }) => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent_ticks' | 'calls' | 'journey'>('agent_ticks');
  const [selectedAgentTab, setSelectedAgentTab] = useState<'agent_1' | 'agent_2' | 'agent_3' | 'agent_4' | 'agent_5'>('agent_1');

  useEffect(() => {
    if (!lead) return;
    setLoading(true);
    Promise.all([fetchLeadCalls(lead.id), fetchLeadActivities(lead.id)])
      .then(([callsData, actsData]) => {
        setCalls(callsData);
        setActivities(actsData);
      })
      .catch((err) => console.error('Failed to load participant details:', err))
      .finally(() => setLoading(false));
  }, [lead]);

  if (!lead) return null;

  const sequenceSteps = [
    { day: 'Day 1', agentId: 'agent_registration', title: 'Agent #1: Registration & Onboarding', desc: 'Welcome call & registration questions', status: lead.agent_status },
    { day: 'Day 3', agentId: 'agent_tech_screening', title: 'Agent #2: Tech & Track Screening', desc: 'Tech stack & submission queries', status: lead.cold_call_status },
    { day: 'Day 5', agentId: 'agent_confirmation', title: 'Agent #3: Attendance Confirmation', desc: 'Confirm team readiness & Discord', status: lead.followup_status },
    { day: 'Day 7', agentId: 'agent_reminder', title: 'Agent #4: Event Reminder', desc: 'Opening ceremony & portal timing', status: lead.reminder_status },
    { day: 'Day 8', agentId: 'agent_feedback', title: 'Agent #5: Feedback & Survey', desc: 'Post-hackathon review & survey', status: lead.email_status },
  ];

  const getAgentBadge = (agentId: string) => {
    switch (agentId) {
      case 'agent_registration':
      case 'agent_snapserve_01':
        return { name: 'Day 1: Agent #1 (Registration)', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'agent_tech_screening':
      case 'agent_snapserve_02':
        return { name: 'Day 3: Agent #2 (Tech Screening)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'agent_confirmation':
        return { name: 'Day 5: Agent #3 (Attendance Confirmation)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'agent_reminder':
        return { name: 'Day 7: Agent #4 (Event Reminder)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'agent_feedback':
        return { name: 'Day 8: Agent #5 (Feedback & Survey)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default:
        return { name: `Agent (${agentId})`, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  // Dedicated tick definitions for each of the 5 Agents
  const agentSubChecklists = {
    agent_1: {
      title: 'Agent #1: Day 1 Registration & Onboarding Ticks',
      agentName: 'Agent 1 (Registration)',
      status: lead.agent_status,
      items: [
        { label: 'Participant Phone Number Carrier Validated', done: lead.number_status === 'completed' },
        { label: 'Day 1 Welcome Call Connected', done: lead.agent_status === 'completed' },
        { label: 'Hackathon Track & Registration Questions Answered', done: lead.agent_status === 'completed' },
        { label: 'Onboarding Starter Guide & Discord Email Dispatched', done: lead.agent_status === 'completed' || lead.email_status === 'completed' },
        { label: 'No Callback Escalation Pending', done: lead.agent_status === 'completed' },
      ],
    },
    agent_2: {
      title: 'Agent #2: Day 3 Tech & Track Screening Ticks',
      agentName: 'Agent 2 (Tech Check)',
      status: lead.cold_call_status,
      items: [
        { label: 'Day 3 Tech Screening Call Completed', done: lead.cold_call_status === 'completed' },
        { label: 'Project Architecture & Custom LLM API Verified', done: lead.cold_call_status === 'completed' },
        { label: 'Team Size & GitHub Repository Guidelines Confirmed', done: lead.cold_call_status === 'completed' },
        { label: 'Technical Mentor Escalation Checked', done: lead.cold_call_status === 'completed' },
      ],
    },
    agent_3: {
      title: 'Agent #3: Day 5 Attendance & Discord Ticks',
      agentName: 'Agent 3 (Attendance)',
      status: lead.followup_status,
      items: [
        { label: 'Day 5 Confirmation Call Connected', done: lead.followup_status === 'completed' },
        { label: 'Final Hackathon Participation Confirmed', done: lead.followup_status === 'completed' || lead.participated_status === 'completed' },
        { label: 'Discord Handle & Team Channel Joined', done: lead.followup_status === 'completed' },
        { label: 'Dev Environment & Hardware Readiness Checked', done: lead.followup_status === 'completed' },
      ],
    },
    agent_4: {
      title: 'Agent #4: Day 7 Ceremony & Event Reminder Ticks',
      agentName: 'Agent 4 (Reminder)',
      status: lead.reminder_status,
      items: [
        { label: 'Day 7 Opening Ceremony Reminder Delivered', done: lead.reminder_status === 'completed' },
        { label: 'Ceremony Zoom / Venue Schedule Acknowledged', done: lead.reminder_status === 'completed' },
        { label: 'Project Submission Portal Access Verified', done: lead.reminder_status === 'completed' },
        { label: '24-Hour Hackathon Countdown Confirmed', done: lead.reminder_status === 'completed' },
      ],
    },
    agent_5: {
      title: 'Agent #5: Day 8 Post-Hackathon Feedback Ticks',
      agentName: 'Agent 5 (Feedback)',
      status: lead.email_status,
      items: [
        { label: 'Day 8 Post-Hackathon Survey Call Completed', done: lead.email_status === 'completed' },
        { label: 'Event & AI Voice Experience Rating Recorded', done: lead.email_status === 'completed' },
        { label: 'Final Project Demo Video Submission Verified', done: lead.email_status === 'completed' },
        { label: 'Participation Certificate Email Dispatched', done: lead.email_status === 'completed' },
      ],
    },
  };

  const selectedChecklist = agentSubChecklists[selectedAgentTab];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-xl bg-white border-l border-gray-200 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-900 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{lead.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <FinalStatusPill status={lead.final_status} />
                      <span className="text-xs text-gray-400 font-mono">Track: {lead.campaign || 'Voiceathon'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Info Pills */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200/60 text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/80">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/80">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate" title={lead.email}>{lead.email}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white">
              <button
                onClick={() => setActiveTab('agent_ticks')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'agent_ticks'
                    ? 'border-purple-600 text-purple-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                5 Agents Verification Ticks
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'calls'
                    ? 'border-purple-600 text-purple-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Call Logs & Transcripts ({calls.length})
              </button>
              <button
                onClick={() => setActiveTab('journey')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'journey'
                    ? 'border-purple-600 text-purple-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Journey
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  {/* TAB 1: INTERACTIVE 5-AGENT TICKS SELECTOR */}
                  {activeTab === 'agent_ticks' && (
                    <div className="space-y-5">
                      {/* Clickable 5-Agent Pill Bar */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                          Click any Agent to inspect verified ticks:
                        </span>
                        <div className="grid grid-cols-5 gap-1.5 bg-gray-100/70 p-1.5 rounded-xl border border-gray-200/80">
                          {[
                            { id: 'agent_1', label: 'Agent 1', sub: 'Reg' },
                            { id: 'agent_2', label: 'Agent 2', sub: 'Tech' },
                            { id: 'agent_3', label: 'Agent 3', sub: 'Confirm' },
                            { id: 'agent_4', label: 'Agent 4', sub: 'Remind' },
                            { id: 'agent_5', label: 'Agent 5', sub: 'Survey' },
                          ].map((ag) => {
                            const isSelected = selectedAgentTab === ag.id;
                            const agStatus = agentSubChecklists[ag.id as keyof typeof agentSubChecklists].status;
                            return (
                              <button
                                key={ag.id}
                                onClick={() => setSelectedAgentTab(ag.id as any)}
                                className={`py-2 px-1 rounded-lg text-center transition-all ${
                                  isSelected
                                    ? 'bg-purple-900 text-white font-bold shadow-sm'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-200'
                                }`}
                              >
                                <div className="text-[11px] leading-tight">{ag.label}</div>
                                <div className="text-[9px] opacity-80 font-normal">{ag.sub}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Agent Verification Ticks Card */}
                      <div className="bg-gradient-to-br from-purple-50/40 via-white to-gray-50 border border-purple-200/90 rounded-2xl p-5 shadow-subtle space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">{selectedChecklist.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Automated AI questions & checklist verification</p>
                          </div>
                          <StatusBadge status={selectedChecklist.status} size="md" />
                        </div>

                        {/* Verified Sub-Items */}
                        <div className="space-y-2 pt-1">
                          {selectedChecklist.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-subtle"
                            >
                              <span className="text-gray-800 font-medium">{item.label}</span>
                              {item.done ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Verified
                                </span>
                              ) : (
                                <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 text-[11px]">
                                  Pending
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-center">
                          Completed: {selectedChecklist.items.filter(i => i.done).length} / {selectedChecklist.items.length} Ticks Verified
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CALL LOGS & TRANSCRIPTS */}
                  {activeTab === 'calls' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>5 AI Agents Call History ({calls.length} total calls)</span>
                        </h3>
                      </div>

                      {calls.length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center">No AI Agent calls recorded for this participant yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {calls.map((call, idx) => {
                            const badge = getAgentBadge(call.agent_id);
                            return (
                              <div
                                key={call.id || idx}
                                className="bg-gradient-to-br from-purple-50/30 via-white to-gray-50 border border-purple-100/90 rounded-xl p-4 shadow-subtle space-y-3 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                                    {badge.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs bg-white/80 p-2.5 rounded-lg border border-gray-100">
                                  <div>
                                    <span className="text-gray-400 text-[10px]">Call ID</span>
                                    <p className="font-mono font-semibold text-gray-800 text-[11px] truncate" title={call.call_id}>
                                      {call.call_id}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-[10px]">Duration</span>
                                    <p className="font-semibold text-gray-800 text-[11px]">
                                      {Math.floor(call.duration / 60)}m {call.duration % 60}s
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-[10px]">Outcome</span>
                                    <p className="font-semibold text-purple-900 text-[11px] capitalize">
                                      {call.outcome || call.call_status}
                                    </p>
                                  </div>
                                </div>

                                {call.summary && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200/80">
                                    <span className="text-[11px] font-bold text-gray-800 block mb-1">AI Executive Summary</span>
                                    <p className="text-xs text-gray-600 leading-relaxed">{call.summary}</p>
                                  </div>
                                )}

                                {call.transcript && (
                                  <div>
                                    <span className="text-[11px] font-bold text-gray-700 block mb-1">Transcript</span>
                                    <pre className="text-[11px] bg-gray-900 text-purple-300 p-3 rounded-lg font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                                      {call.transcript}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: JOURNEY */}
                  {activeTab === 'journey' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-purple-600" />
                          <span>5-Agent Multi-Day Sequence Progress</span>
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {sequenceSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50/80 transition-all shadow-subtle"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex flex-col items-center justify-center font-bold text-[10px]">
                                <span>{step.day}</span>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">{step.title}</h4>
                                <p className="text-[11px] text-gray-500">{step.desc}</p>
                              </div>
                            </div>
                            <StatusBadge status={step.status} size="md" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
              <span>Updated {new Date(lead.updated_at).toLocaleTimeString()}</span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium shadow-sm transition-all"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
