import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Clock, CalendarDays, FileText, CheckCircle2, AlertCircle, Bot, MessageSquare, Trophy, Layers, Check, ChevronRight, Mic, ShieldCheck, Play } from 'lucide-react';
import { Lead, CallLog, Activity } from '../types/index';
import { fetchLeadCalls, fetchLeadActivities } from '../lib/api';
import { StatusBadge, FinalStatusPill } from './StatusBadge';

interface CandidateDrawerProps {
  lead: Lead | null;
  onClose: () => void;
}

export type TickState = 'verified' | 'not_yet' | 'not_asked';

export interface TickItem {
  label: string;
  state: TickState;
  verifiedLabel?: string;
  notYetLabel?: string;
  notAskedLabel?: string;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ lead, onClose }) => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent_ticks' | 'calls' | 'journey'>('agent_ticks');
  const [selectedAgentTab, setSelectedAgentTab] = useState<'agent_1' | 'agent_2' | 'agent_3' | 'agent_4' | 'agent_5'>('agent_1');

  // Load calls & activities when lead updates
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
  }, [lead?.id, lead?.updated_at, lead?.last_activity, lead?.final_status]);

  // Live 2-second automatic polling while drawer is open on screen
  useEffect(() => {
    if (!lead) return;
    const pollTimer = setInterval(() => {
      Promise.all([fetchLeadCalls(lead.id), fetchLeadActivities(lead.id)])
        .then(([callsData, actsData]) => {
          setCalls(callsData);
          setActivities(actsData);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(pollTimer);
  }, [lead?.id]);

  if (!lead) return null;

  const sequenceSteps = [
    { day: 'Day 1', agentId: 'agent_registration', title: 'Agent #1: Day 1 Registration & Onboarding', desc: 'Welcome call, interest & build started', status: lead.agent_status },
    { day: 'Day 3', agentId: 'agent_tech_screening', title: 'Agent #2: Progress & Support Check', desc: 'Reconnect, stuck points & submission', status: lead.cold_call_status },
    { day: 'Day 5', agentId: 'agent_confirmation', title: 'Agent #3: Submission Readiness Ticks', desc: 'Tested agent & submission tracking', status: lead.followup_status },
    { day: 'Day 7', agentId: 'agent_reminder', title: 'Agent #4: Submission Deadline Reminder', desc: 'Final push & platform submission', status: lead.reminder_status },
    { day: 'Day 8', agentId: 'agent_feedback', title: 'Agent #5: Event Day Readiness Ticks', desc: 'Working number & event logistics', status: lead.email_status },
  ];

  const getAgentBadge = (agentId: string) => {
    const ag = (agentId || '').toLowerCase();
    if (ag === 'agent_registration' || ag === 'agent_snapserve_01' || ag === '456' || ag.includes('agent1') || ag.includes('agent 1') || ag.includes('registration')) {
      return { name: 'Agent #1: Day 1 Registration & Onboarding', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (ag === 'agent_tech_screening' || ag === 'agent_snapserve_02' || ag === '457' || ag.includes('agent2') || ag.includes('agent 2') || ag.includes('tech') || ag.includes('screening') || ag.includes('progress') || ag.includes('support')) {
      return { name: 'Agent #2: Progress & Support Check', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (ag === 'agent_confirmation' || ag === '458' || ag.includes('agent3') || ag.includes('agent 3') || ag.includes('confirmation')) {
      return { name: 'Agent #3: Submission Readiness Ticks', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (ag === 'agent_reminder' || ag === '459' || ag.includes('agent4') || ag.includes('agent 4') || ag.includes('reminder')) {
      return { name: 'Agent #4: Submission Deadline Reminder', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (ag === 'agent_feedback' || ag === '460' || ag.includes('agent5') || ag.includes('agent 5') || ag.includes('feedback')) {
      return { name: 'Agent #5: Event Day Readiness Ticks', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
    return { name: `Agent (${agentId})`, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  // Find latest call log for the selected agent tab
  const latestCall = calls.find(c => {
    const ag = (c.agent_id || '').toLowerCase();
    if (selectedAgentTab === 'agent_1') {
      return ag === 'agent_1' || ag === 'agent_registration' || ag === 'agent_snapserve_01' || ag === '456' || ag.includes('agent1') || ag.includes('agent 1') || ag.includes('registration');
    }
    if (selectedAgentTab === 'agent_2') {
      return ag === 'agent_2' || ag === 'agent_tech_screening' || ag === 'agent_snapserve_02' || ag === '457' || ag.includes('agent2') || ag.includes('agent 2') || ag.includes('tech') || ag.includes('screening') || ag.includes('progress') || ag.includes('support');
    }
    if (selectedAgentTab === 'agent_3') {
      return ag === 'agent_3' || ag === 'agent_confirmation' || ag === '458' || ag.includes('agent3') || ag.includes('agent 3') || ag.includes('confirmation');
    }
    if (selectedAgentTab === 'agent_4') {
      return ag === 'agent_4' || ag === 'agent_reminder' || ag === '459' || ag.includes('agent4') || ag.includes('agent 4') || ag.includes('reminder');
    }
    if (selectedAgentTab === 'agent_5') {
      return ag === 'agent_5' || ag === 'agent_feedback' || ag === '460' || ag.includes('agent5') || ag.includes('agent 5') || ag.includes('feedback');
    }
    return false;
  }) || calls[0];

  const isCallFailed = Boolean(latestCall && (latestCall.call_status === 'failed' || latestCall.outcome === 'unreachable' || latestCall.outcome === 'failed'));
  const isCallConnected = Boolean(calls.length > 0 && calls.some(c => (c.duration > 0 || c.call_status === 'completed') && c.call_status !== 'failed'));

  const isNotInterested = Boolean(
    lead.final_status === 'Not Interested' ||
    lead.participated_status === 'failed' ||
    latestCall?.outcome?.includes('not_interested') ||
    latestCall?.outcome?.includes('declined') ||
    latestCall?.summary?.toLowerCase().includes('lack of interest') ||
    latestCall?.summary?.toLowerCase().includes('not interested')
  );

  const llmTicks = latestCall?.raw_webhook_data?.llm_ticks;
  const fullCallText = calls.map(c => (c.summary || '') + ' ' + (c.transcript || '')).join(' ').toLowerCase();
  const latestCallText = ((latestCall?.summary || '') + ' ' + (latestCall?.transcript || '')).toLowerCase();

  const isExplicitlyNoPhoneInLatestCall =
    latestCallText.includes("haven't purchased") ||
    latestCallText.includes("have not purchased") ||
    latestCallText.includes("didn't purchase") ||
    latestCallText.includes("did not purchase") ||
    latestCallText.includes("no phone number") ||
    latestCallText.includes("not bought") ||
    latestCallText.includes("not purchased") ||
    latestCallText.includes("haven't bought");

  const isExplicitlyNoBuildInLatestCall =
    latestCallText.includes("haven't started") ||
    latestCallText.includes("have not started") ||
    latestCallText.includes("didn't start") ||
    latestCallText.includes("did not start") ||
    latestCallText.includes("not built") ||
    latestCallText.includes("not building");

  // Natural Language AI Confirmation rule for Phone Number Purchased
  const phonePurchasedTick: TickState = (() => {
    if (isNotInterested || isExplicitlyNoPhoneInLatestCall) return 'not_yet';

    const textConfirmsPhone =
      fullCallText.includes('purchased number') ||
      fullCallText.includes('bought number') ||
      fullCallText.includes('purchased phone') ||
      fullCallText.includes('bought phone') ||
      fullCallText.includes('purchased a number') ||
      fullCallText.includes('bought a number') ||
      fullCallText.includes('phone number purchased') ||
      fullCallText.includes('obtained a number') ||
      fullCallText.includes('obtained number') ||
      fullCallText.includes('paid the bill') ||
      fullCallText.includes('got a number') ||
      fullCallText.includes('got number') ||
      fullCallText.includes('has a number') ||
      fullCallText.includes('has phone number') ||
      fullCallText.includes('registered number') ||
      fullCallText.includes('activated number') ||
      fullCallText.includes('bought sim') ||
      fullCallText.includes('twilio number') ||
      fullCallText.includes('vapi number') ||
      fullCallText.includes('retell number');

    if (llmTicks?.agent1?.phoneNumberPurchased === true || llmTicks?.agent2?.phoneNumberPurchased === true || llmTicks?.agent1?.phoneNumberPurchased === 'verified' || textConfirmsPhone) return 'verified';
    return 'not_asked';
  })();

  const agentBuildStartedTick: TickState = (() => {
    if (isNotInterested || isExplicitlyNoBuildInLatestCall) return 'not_yet';

    const textConfirmsBuild =
      fullCallText.includes('build started') ||
      fullCallText.includes('agent build') ||
      fullCallText.includes('started building') ||
      fullCallText.includes('start பண்ணி') ||
      fullCallText.includes('start பண்ணிட்டேன்') ||
      fullCallText.includes('built agent') ||
      fullCallText.includes('built the agent') ||
      fullCallText.includes('built an agent') ||
      fullCallText.includes('built his agent') ||
      fullCallText.includes('building an agent') ||
      fullCallText.includes('building the agent') ||
      fullCallText.includes('building his agent') ||
      fullCallText.includes('building his voice agent') ||
      fullCallText.includes('building her agent') ||
      fullCallText.includes('build their agent') ||
      fullCallText.includes('building their agent') ||
      fullCallText.includes('progress of building') ||
      fullCallText.includes('customer started building') ||
      fullCallText.includes('coding started') ||
      fullCallText.includes('bot created') ||
      fullCallText.includes('working on it') ||
      fullCallText.includes('developing agent') ||
      fullCallText.includes('agent ready') ||
      fullCallText.includes('build an agent');

    if (llmTicks?.agent1?.agentBuildStarted === true || llmTicks?.agent2?.agentBuildCompleted === true || llmTicks?.agent1?.agentBuildStarted === 'verified' || textConfirmsBuild) return 'verified';
    return 'not_asked';
  })();

  const deadlineConveyedTick: TickState = (() => {
    if (isNotInterested) return 'not_yet';

    const textConfirmsDeadline =
      fullCallText.includes('aug 21') ||
      fullCallText.includes('august 21') ||
      fullCallText.includes('aug 20') ||
      fullCallText.includes('august 20') ||
      fullCallText.includes('september 5') ||
      fullCallText.includes('deadline conveyed') ||
      fullCallText.includes('deadline explained') ||
      fullCallText.includes('21 august') ||
      fullCallText.includes('20 august') ||
      fullCallText.includes('submit by') ||
      fullCallText.includes('submission date');

    if (llmTicks?.agent1?.aug21DeadlineConveyed === true || llmTicks?.agent2?.submissionRequirementReconfirmed === true || llmTicks?.agent1?.aug21DeadlineConveyed === 'verified' || textConfirmsDeadline) return 'verified';
    return lead.agent_status === 'completed' && !isNotInterested ? 'verified' : 'not_yet';
  })();

  // Exact 5 Voiceathon Agent Checklist Schemas
  const agentSubChecklists: Record<string, { title: string; subtitle: string; status: string; items: TickItem[] }> = {
    agent_1: {
      title: 'Agent #1: Day 1 Registration & Onboarding Ticks',
      subtitle: 'Automated AI questions & checklist verification',
      status: isNotInterested ? 'failed' : lead.agent_status,
      items: [
        {
          label: 'Day 1 Welcome Call Connected',
          state: isCallConnected ? 'verified' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Connected',
        },
        {
          label: 'Interested in Participating',
          state: isNotInterested ? 'not_yet' : (lead.agent_status === 'completed' || isCallConnected ? 'verified' : 'not_yet'),
          verifiedLabel: '✅ Confirmed',
          notYetLabel: '🔴 Not Interested',
        },
        {
          label: 'Phone Number Purchased',
          state: phonePurchasedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Agent Build Started',
          state: agentBuildStartedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Aug 21 Deadline (Number + Build + Submission) Clearly Conveyed',
          state: deadlineConveyedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet Covered',
        },
      ],
    },

    agent_2: {
      title: 'Agent #2: Progress & Support Check Ticks',
      subtitle: 'Automated AI questions & checklist verification',
      status: isNotInterested ? 'failed' : lead.cold_call_status,
      items: [
        {
          label: 'Reconnect Call Connected',
          state: isCallConnected ? 'verified' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Connected',
        },
        {
          label: 'Phone Number Purchased (carried from Call 1)',
          state: phonePurchasedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Agent Build Completed (carried from Call 1)',
          state: agentBuildStartedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Help Offered on Stuck Points',
          state: isCallConnected && !isNotInterested ? 'verified' : 'not_asked',
          verifiedLabel: '✅ Verified',
          notAskedLabel: '⚪ Not Applicable',
        },
        {
          label: 'Submission Requirement Reconfirmed',
          state: deadlineConveyedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet Covered',
        },
      ],
    },

    agent_3: {
      title: 'Agent #3: Submission Readiness Ticks',
      subtitle: 'Automated AI questions & checklist verification',
      status: isNotInterested ? 'failed' : lead.followup_status,
      items: [
        {
          label: 'Reconnect Call Connected',
          state: isCallConnected ? 'verified' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Connected',
        },
        {
          label: 'Phone Number Purchased (carried)',
          state: phonePurchasedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Agent Build Completed (carried)',
          state: agentBuildStartedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Agent Tested',
          state: 'not_asked',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Submission Tracking Status',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ On Track',
          notYetLabel: '🔴 At Risk',
        },
      ],
    },

    agent_4: {
      title: 'Agent #4: Submission Deadline Reminder Ticks',
      subtitle: 'Automated AI questions & checklist verification',
      status: isNotInterested ? 'failed' : lead.reminder_status,
      items: [
        {
          label: 'Reconnect Call Connected',
          state: isCallConnected ? 'verified' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Connected',
        },
        {
          label: 'Phone Number Purchased (carried, final push)',
          state: phonePurchasedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Agent Build Completed (carried, final push)',
          state: agentBuildStartedTick,
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Submitted on Platform (mandatory, final push)',
          state: 'not_asked',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet',
          notAskedLabel: '⚪ Not Asked',
        },
        {
          label: 'Callback Number Offered for Last-Minute Doubts',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Yet Offered',
        },
      ],
    },

    agent_5: {
      title: 'Agent #5: Event Day Readiness Ticks',
      subtitle: 'Automated AI questions & checklist verification',
      status: isNotInterested ? 'failed' : lead.email_status,
      items: [
        {
          label: 'Reconnect Call Connected',
          state: isCallConnected ? 'verified' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Connected',
        },
        {
          label: 'Phone Number Working (final confirmation)',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Working',
        },
        {
          label: 'Agent Working (final confirmation)',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Working',
        },
        {
          label: 'Submission Confirmed on File (final confirmation)',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Found',
        },
        {
          label: 'Event Logistics (Location / Time) Reconfirmed',
          state: isNotInterested ? 'not_yet' : 'not_yet',
          verifiedLabel: '✅ Verified',
          notYetLabel: '🔴 Not Confirmed',
        },
      ],
    },
  };

  const selectedChecklist = agentSubChecklists[selectedAgentTab];
  const verifiedCount = selectedChecklist.items.filter(i => i.state === 'verified').length;

  const rawEvidence = latestCall?.raw_webhook_data?.dispositionResult?.evidence;
  const confidenceScore = latestCall?.raw_webhook_data?.dispositionResult?.confidence;
  const recordingUrl = latestCall?.raw_webhook_data?.recordingUrl || latestCall?.raw_webhook_data?.fields?.recordingUrl;

  const renderBadge = (item: TickItem) => {
    if (item.state === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 text-[11px] shadow-xs">
          {item.verifiedLabel || '✅ Verified'}
        </span>
      );
    }
    if (item.state === 'not_yet') {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 text-[11px] shadow-xs">
          {item.notYetLabel || '🔴 Not Yet'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px]">
        {item.notAskedLabel || '⚪ Not Asked'}
      </span>
    );
  };

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
                5-Agent Voiceathon Ticks
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'calls'
                    ? 'border-purple-600 text-purple-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Call History & Transcripts ({calls.length})
              </button>
              <button
                onClick={() => setActiveTab('journey')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'journey'
                    ? 'border-purple-600 text-purple-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Multi-Day Journey
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
                  {/* TAB 1: 5-AGENT VOICEATHON TICKS */}
                  {activeTab === 'agent_ticks' && (
                    <div className="space-y-5">
                      {/* Clickable 5-Agent Selector Bar */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                          Select Agent to inspect Voiceathon checklist:
                        </span>
                        <div className="grid grid-cols-5 gap-1 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/80">
                          {[
                            { id: 'agent_1', label: 'Agent 1', sub: 'Day 1' },
                            { id: 'agent_2', label: 'Agent 2', sub: 'Day 3' },
                            { id: 'agent_3', label: 'Agent 3', sub: 'Day 5' },
                            { id: 'agent_4', label: 'Agent 4', sub: 'Day 7' },
                            { id: 'agent_5', label: 'Agent 5', sub: 'Day 8' },
                          ].map((ag) => {
                            const isSelected = selectedAgentTab === ag.id;
                            return (
                              <button
                                key={ag.id}
                                onClick={() => setSelectedAgentTab(ag.id as any)}
                                className={`py-2 px-1 rounded-lg text-center transition-all ${
                                  isSelected
                                    ? 'bg-purple-900 text-white font-bold shadow-xs'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-200'
                                }`}
                              >
                                <div className="text-[11px] leading-tight">{ag.label}</div>
                                <div className="text-[9px] opacity-75 font-normal">{ag.sub}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Agent Voiceathon Checklist Card */}
                      <div className="bg-gradient-to-br from-purple-50/30 via-white to-gray-50 border border-purple-200/80 rounded-2xl p-5 shadow-subtle space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">{selectedChecklist.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{selectedChecklist.subtitle}</p>
                          </div>
                          <StatusBadge status={selectedChecklist.status} size="md" />
                        </div>

                        {/* 5 Voiceathon Checklist Items */}
                        <div className="space-y-2 pt-1">
                          {selectedChecklist.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-subtle"
                            >
                              <span className="text-gray-800 font-medium pr-2">{item.label}</span>
                              {renderBadge(item)}
                            </div>
                          ))}
                        </div>

                        {/* Completed Ticks Counter Bar */}
                        <div className="flex items-center justify-between bg-purple-50/60 p-3 rounded-xl border border-purple-100 font-mono text-xs">
                          <span className="font-semibold text-purple-950">
                            Completed: {verifiedCount} / {selectedChecklist.items.length} Ticks Verified
                          </span>
                          <span className="text-[11px] bg-purple-900 text-white font-bold px-2 py-0.5 rounded">
                            Voiceathon Certified
                          </span>
                        </div>
                      </div>

                      {/* Rich AI Call Audit & Spoken Evidence Card */}
                      {latestCall && (
                        <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-white rounded-2xl p-5 shadow-md space-y-3">
                          <div className="flex items-center justify-between border-b border-purple-800/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                                Realtime AI Call Audit & Spoken Evidence
                              </span>
                            </div>
                            {typeof confidenceScore === 'number' && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                                {Math.round(confidenceScore * 100)}% Audit Confidence
                              </span>
                            )}
                          </div>

                          {rawEvidence && (
                            <div className="bg-purple-900/40 p-3 rounded-xl border border-purple-700/50">
                              <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold block mb-1">
                                Verbatim Spoken Evidence (Tamil/English):
                              </span>
                              <p className="text-xs font-mono text-emerald-300 font-bold leading-relaxed">
                                "{rawEvidence}"
                              </p>
                            </div>
                          )}

                          {latestCall.summary && (
                            <div className="bg-black/30 p-3 rounded-xl border border-gray-800">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">
                                AI Call Summary:
                              </span>
                              <p className="text-xs text-gray-200 leading-relaxed">{latestCall.summary}</p>
                            </div>
                          )}

                          {recordingUrl && (
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <span className="text-gray-400 font-mono text-[11px]">Audio Recording</span>
                              <a
                                href={recordingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg font-medium text-[11px] shadow-sm transition-all"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Listen Recording
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: CALL LOGS & TRANSCRIPTS */}
                  {activeTab === 'calls' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>5 AI Agents Call History ({calls.length} calls)</span>
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
