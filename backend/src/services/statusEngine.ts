import { Lead, SnapServeNormalizedEvent, FinalStatus, ActivityStatus } from '../types';

export class StatusEngine {
  /**
   * Updates lead status fields based on incoming webhook event and returns updated lead object with newly computed final_status.
   */
  public evaluateLeadStatus(lead: Lead, event: SnapServeNormalizedEvent): Lead {
    const updatedLead: Lead = { ...lead };

    const outcome = (event.outcome || '').toLowerCase();
    const summary = (event.summary || '').toLowerCase();
    const transcript = (event.transcript || '').toLowerCase();
    const agId = (event.agentId || '').toLowerCase();

    const isNotInterested =
      outcome.includes('not_interested') ||
      outcome.includes('declined') ||
      summary.includes('not interested') ||
      summary.includes('lack of interest') ||
      transcript.includes('not interested');

    const isCallSuccess = event.callStatus === 'completed' && event.outcome !== 'wrong_number' && !isNotInterested;

    if (isNotInterested) {
      updatedLead.agent_status = 'failed';
      updatedLead.participated_status = 'failed';
    } else {
      // Re-engage participant on successful positive call
      updatedLead.participated_status = 'completed';

      const isAgent1 = agId === 'agent_registration' || agId === 'agent_snapserve_01' || agId === '456' || agId === 'agent_1' || agId.includes('agent1') || agId.includes('agent 1') || agId.includes('registration') || !agId;
      const isAgent2 = agId === 'agent_tech_screening' || agId === 'agent_snapserve_02' || agId === '457' || agId === 'agent_2' || agId.includes('agent2') || agId.includes('agent 2') || agId.includes('tech') || agId.includes('screening') || agId.includes('progress') || agId.includes('support');
      const isAgent3 = agId === 'agent_confirmation' || agId === '458' || agId === 'agent_3' || agId.includes('agent3') || agId.includes('agent 3') || agId.includes('confirmation') || agId.includes('readiness');
      const isAgent4 = agId === 'agent_reminder' || agId === '459' || agId === 'agent_4' || agId.includes('agent4') || agId.includes('agent 4') || agId.includes('reminder') || agId.includes('deadline');
      const isAgent5 = agId === 'agent_feedback' || agId === '460' || agId === 'agent_5' || agId.includes('agent5') || agId.includes('agent 5') || agId.includes('feedback') || agId.includes('event day');

      // Agent 1: Day 1 — Registration & Onboarding Call
      if (isAgent1) {
        if (isCallSuccess) {
          updatedLead.agent_status = 'completed'; // Green Tick ✓ for Agent 1!
        } else {
          updatedLead.agent_status = 'failed';
        }
      }

      // Agent 2: Day 3 — Tech & Track Screening Call
      if (isAgent2) {
        if (isCallSuccess) {
          updatedLead.cold_call_status = 'completed'; // Green Tick ✓ for Agent 2!
        } else {
          updatedLead.cold_call_status = 'failed';
        }
      }

      // Agent 3: Day 5 — Attendance & Discord Confirmation Call
      if (isAgent3) {
        if (isCallSuccess) {
          updatedLead.followup_status = 'completed'; // Green Tick ✓ for Agent 3!
        } else {
          updatedLead.followup_status = 'failed';
        }
      }

      // Agent 4: Day 7 — Opening Ceremony & Event Reminder Call
      if (isAgent4) {
        if (isCallSuccess) {
          updatedLead.reminder_status = 'completed'; // Green Tick ✓ for Agent 4!
        } else {
          updatedLead.reminder_status = 'failed';
        }
      }

      // Agent 5: Day 8 — Post-Hackathon Feedback & Survey Call
      if (isAgent5) {
        if (isCallSuccess) {
          updatedLead.email_status = 'completed'; // Green Tick ✓ for Agent 5!
        } else {
          updatedLead.email_status = 'failed';
        }
      }
    }

    // Phone number validation rule
    if (event.numberValid === false || (event.callStatus === 'failed' && event.outcome?.includes('invalid'))) {
      updatedLead.number_status = 'failed';
    } else if (isCallSuccess) {
      updatedLead.number_status = 'completed';
    }

    // Follow-up requested rule
    if (event.callbackRequired) {
      updatedLead.followup_status = 'pending';
    }

    // Calculate Final Status based on aggregated activity flags
    updatedLead.final_status = this.calculateFinalStatus(updatedLead, event, isNotInterested);
    updatedLead.last_call_id = event.callId;
    updatedLead.last_activity = new Date().toISOString();

    return updatedLead;
  }

  /**
   * Deterministic Calculation of Final Status
   */
  public calculateFinalStatus(lead: Lead, latestEvent?: SnapServeNormalizedEvent, isNotInterested: boolean = false): FinalStatus {
    // If latest call expressed lack of interest
    if (isNotInterested) {
      return 'Not Interested' as any;
    }

    // If phone number is invalid
    if (lead.number_status === 'failed') {
      return 'Invalid Number';
    }

    // If call failed
    if (latestEvent?.callStatus === 'failed') {
      return 'Call Failed';
    }

    // If call currently in progress
    if (latestEvent?.callStatus === 'in_progress') {
      return 'Calling';
    }

    // If follow-up is pending or requested
    if (lead.followup_status === 'pending') {
      return 'Follow-up Pending';
    }

    // If reminder is pending
    if (lead.reminder_status === 'pending') {
      return 'Reminder Pending';
    }

    // If Agent 5 / all agents completed
    if (lead.email_status === 'completed' && lead.reminder_status === 'completed') {
      return 'Completed';
    }

    // Default to Participated if at least Agent 1 is completed
    if (lead.agent_status === 'completed' || lead.cold_call_status === 'completed') {
      return 'Participated';
    }

    return 'Not Started';
  }
}

export const statusEngine = new StatusEngine();
