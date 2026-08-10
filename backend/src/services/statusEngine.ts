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
      // Agent 1: Day 1 — Registration & Onboarding Call
      if (event.agentId === 'agent_registration' || event.agentId === 'agent_snapserve_01' || event.agentId === '456' || !event.agentId) {
        if (isCallSuccess) {
          updatedLead.agent_status = 'completed'; // Green Tick ✓ for Agent 1!
        } else {
          updatedLead.agent_status = 'failed'; // Red 🔴 for Agent 1!
        }
      }

      // Agent 2: Day 3 — Tech & Track Screening Call
      if (event.agentId === 'agent_tech_screening' || event.agentId === 'agent_snapserve_02') {
        if (isCallSuccess) {
          updatedLead.cold_call_status = 'completed';
        } else {
          updatedLead.cold_call_status = 'failed';
        }
      }

      // Agent 3: Day 5 — Attendance & Discord Confirmation Call
      if (event.agentId === 'agent_confirmation') {
        if (isCallSuccess) {
          updatedLead.followup_status = 'completed';
        } else {
          updatedLead.followup_status = 'failed';
        }
      }

      // Agent 4: Day 7 — Opening Ceremony & Event Reminder Call
      if (event.agentId === 'agent_reminder') {
        if (isCallSuccess) {
          updatedLead.reminder_status = 'completed';
        } else {
          updatedLead.reminder_status = 'failed';
        }
      }

      // Agent 5: Day 8 — Post-Hackathon Feedback & Survey Call
      if (event.agentId === 'agent_feedback') {
        if (isCallSuccess) {
          updatedLead.email_status = 'completed';
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

    // Participation rule
    if (!isNotInterested && (event.participated || (event.duration && event.duration > 15))) {
      updatedLead.participated_status = 'completed';
    } else if (isNotInterested) {
      updatedLead.participated_status = 'failed';
    }

    // Email status rule
    if (event.emailSent || event.event === 'email.sent') {
      updatedLead.email_status = 'completed';
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
    // If participant expressed lack of interest
    if (isNotInterested || lead.participated_status === 'failed') {
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
    if (lead.agent_status === 'completed') {
      return 'Participated';
    }

    return 'Not Started';
  }
}

export const statusEngine = new StatusEngine();
