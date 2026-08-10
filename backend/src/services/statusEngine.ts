import { Lead, SnapServeNormalizedEvent, FinalStatus, ActivityStatus } from '../types';

export class StatusEngine {
  /**
   * Updates lead status fields based on incoming webhook event and returns updated lead object with newly computed final_status.
   */
  public evaluateLeadStatus(lead: Lead, event: SnapServeNormalizedEvent): Lead {
    const updatedLead: Lead = { ...lead };

    const isCallSuccess = event.callStatus === 'completed' && event.outcome !== 'wrong_number';

    // Agent 1: Day 1 — Registration & Onboarding Call
    if (event.agentId === 'agent_registration' || event.agentId === 'agent_snapserve_01' || !event.agentId) {
      if (isCallSuccess) {
        updatedLead.agent_status = 'completed'; // Green Tick ✓ for Agent 1!
      } else if (event.callStatus === 'failed') {
        updatedLead.agent_status = 'failed';
      }
    }

    // Agent 2: Day 3 — Tech & Track Screening Call
    if (event.agentId === 'agent_tech_screening' || event.agentId === 'agent_snapserve_02') {
      if (isCallSuccess) {
        updatedLead.cold_call_status = 'completed'; // Green Tick ✓ for Agent 2!
      } else if (event.callStatus === 'failed') {
        updatedLead.cold_call_status = 'failed';
      }
    }

    // Agent 3: Day 5 — Attendance & Discord Confirmation Call
    if (event.agentId === 'agent_confirmation') {
      if (isCallSuccess) {
        updatedLead.followup_status = 'completed'; // Green Tick ✓ for Agent 3!
      } else if (event.callStatus === 'failed') {
        updatedLead.followup_status = 'failed';
      }
    }

    // Agent 4: Day 7 — Opening Ceremony & Event Reminder Call
    if (event.agentId === 'agent_reminder') {
      if (isCallSuccess) {
        updatedLead.reminder_status = 'completed'; // Green Tick ✓ for Agent 4!
      } else if (event.callStatus === 'failed') {
        updatedLead.reminder_status = 'failed';
      }
    }

    // Agent 5: Day 8 — Post-Hackathon Feedback & Survey Call
    if (event.agentId === 'agent_feedback') {
      if (isCallSuccess) {
        updatedLead.email_status = 'completed'; // Green Tick ✓ for Agent 5!
      } else if (event.callStatus === 'failed') {
        updatedLead.email_status = 'failed';
      }
    }

    // Phone number validation rule
    if (event.numberValid === false || (event.callStatus === 'failed' && event.outcome?.includes('invalid'))) {
      updatedLead.number_status = 'failed';
    } else if (isCallSuccess) {
      updatedLead.number_status = 'completed';
    }

    // Participation rule
    if (event.participated || (event.duration && event.duration > 15)) {
      updatedLead.participated_status = 'completed';
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
    updatedLead.final_status = this.calculateFinalStatus(updatedLead, event);
    updatedLead.last_call_id = event.callId;
    updatedLead.last_activity = new Date().toISOString();

    return updatedLead;
  }

  /**
   * Deterministic Calculation of Final Status
   */
  public calculateFinalStatus(lead: Lead, latestEvent?: SnapServeNormalizedEvent): FinalStatus {
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

    // If participant confirmed
    if (lead.participated_status === 'completed' || lead.followup_status === 'completed') {
      return 'Participated';
    }

    // Default fallback if Agent 1 completed
    if (lead.agent_status === 'completed') {
      return 'Participated';
    }

    return 'Not Started';
  }
}

export const statusEngine = new StatusEngine();
