import React, { useState } from 'react';
import { X, Play, Zap, CheckCircle2, PhoneCall, AlertTriangle, UserPlus, CalendarDays } from 'lucide-react';
import { triggerSimulatedWebhook } from '../lib/api';

interface WebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState('+919876543210');
  const [targetName, setTargetName] = useState('Arun Kumar');
  const [selectedDayStage, setSelectedDayStage] = useState<'day1' | 'day3' | 'day5' | 'day7' | 'day8'>('day1');
  const [eventType, setEventType] = useState<'completed_callback' | 'completed_success' | 'call_failed' | 'invalid_number'>('completed_callback');

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);

    let agentId = 'agent_registration';
    let dayLabel = 'Day 1';
    let stageSummary = '';

    switch (selectedDayStage) {
      case 'day1':
        agentId = 'agent_registration';
        dayLabel = 'Day 1';
        stageSummary = 'Day 1 Call (Agent #1): Participant registered and onboarded into Voiceathon track.';
        break;
      case 'day3':
        agentId = 'agent_tech_screening';
        dayLabel = 'Day 3';
        stageSummary = 'Day 3 Call (Agent #2): Tech stack screening & LLM tools technical inquiry handled.';
        break;
      case 'day5':
        agentId = 'agent_confirmation';
        dayLabel = 'Day 5';
        stageSummary = 'Day 5 Call (Agent #3): Final team attendance & Discord handle confirmed.';
        break;
      case 'day7':
        agentId = 'agent_reminder';
        dayLabel = 'Day 7';
        stageSummary = 'Day 7 Call (Agent #4): Hackathon opening ceremony & portal submission reminder.';
        break;
      case 'day8':
        agentId = 'agent_feedback';
        dayLabel = 'Day 8';
        stageSummary = 'Day 8 Call (Agent #5): Post-hackathon feedback & project submission survey completed.';
        break;
    }

    const callId = `call_${selectedDayStage}_${Date.now().toString().slice(-4)}`;

    let payload: any = {
      event: eventType === 'call_failed' || eventType === 'invalid_number' ? 'call.failed' : 'call.completed',
      call_id: callId,
      phone: targetPhone,
      name: targetName,
      agent_id: agentId,
      call_status: eventType === 'call_failed' || eventType === 'invalid_number' ? 'failed' : 'completed',
      outcome: eventType === 'completed_callback' ? 'callback_requested' : eventType,
      duration: eventType === 'call_failed' ? 0 : 165,
      summary: stageSummary,
      transcript: `AI (${agentId} - ${dayLabel}): Calling participant regarding hackathon sequence step ${dayLabel}.\nParticipant: Everything confirmed for ${dayLabel}!`,
      callback_required: eventType === 'completed_callback',
      number_valid: eventType !== 'invalid_number',
      participated: eventType === 'completed_success' || selectedDayStage === 'day8',
      email_sent: true,
    };

    try {
      const result = await triggerSimulatedWebhook(payload);
      if (result.success) {
        onSuccess(`${dayLabel} call event from ${agentId} processed!`);
        onClose();
      } else {
        alert(`Error: ${result.error || 'Failed to process simulated webhook'}`);
      }
    } catch (err: any) {
      alert(`Webhook Trigger Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Multi-Day Sequence Webhook Simulator</h3>
              <p className="text-[11px] text-gray-500">Test agent calls across different schedule days</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Select Multi-Day Sequence Day & Agent</label>
            <select
              value={selectedDayStage}
              onChange={(e) => setSelectedDayStage(e.target.value as any)}
              className="w-full bg-purple-50/70 border border-purple-200 rounded-lg px-3 py-2 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
            >
              <option value="day1">Day 1: Agent #1 — Registration & Onboarding</option>
              <option value="day3">Day 3: Agent #2 — Tech & Track Screening</option>
              <option value="day5">Day 5: Agent #3 — Attendance & Discord Confirmation</option>
              <option value="day7">Day 7: Agent #4 — Opening Ceremony & Event Reminder</option>
              <option value="day8">Day 8: Agent #5 — Post-Hackathon Feedback & Survey</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Participant Phone</label>
            <input
              type="text"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Participant Name</label>
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Call Result Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'completed_success', label: 'Call Successful', icon: CheckCircle2 },
                { id: 'completed_callback', label: 'Follow-up Needed', icon: PhoneCall },
                { id: 'call_failed', label: 'Call Failed', icon: AlertTriangle },
                { id: 'invalid_number', label: 'Invalid Number', icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = eventType === item.id;
                return (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-50/80 border-purple-200 ring-1 ring-purple-300'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="event_preset"
                        checked={isChecked}
                        onChange={() => setEventType(item.id as any)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] font-medium text-gray-800">{item.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-xs font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{loading ? 'Sending...' : 'Trigger Webhook POST'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
