import { Lead, SnapServeNormalizedEvent, FinalStatus } from '../types';
import { LLMOutcomeResult } from './llmOutcomeService';

export class StatusEngine {
  /**
   * Updates lead status fields based on incoming webhook event and LLM outcome analysis result.
   */
  public evaluateLeadStatus(
    lead: Lead,
    event: SnapServeNormalizedEvent,
    outcomeResult?: LLMOutcomeResult
  ): Lead {
    const updatedLead: Lead = { ...lead };

    if (outcomeResult) {
      // 1. Agent status (connected)
      if (outcomeResult.call_connected) {
        updatedLead.agent_status = 'completed';
      } else if (updatedLead.agent_status !== 'completed') {
        updatedLead.agent_status = 'failed';
      }

      // 2. Cold Call status (answered)
      if (outcomeResult.participant_answered) {
        updatedLead.cold_call_status = 'completed';
      } else if (updatedLead.cold_call_status !== 'completed') {
        updatedLead.cold_call_status = 'failed';
      }

      // 3. Follow-up status
      if (outcomeResult.follow_up_required) {
        updatedLead.followup_status = 'pending';
      } else if (updatedLead.followup_status === 'pending') {
        updatedLead.followup_status = 'not_started';
      }

      // 4. Reminder status
      if (outcomeResult.reminder_required) {
        updatedLead.reminder_status = 'pending';
      }

      // 5. Number / required condition status
      if (outcomeResult.required_condition === 'completed') {
        updatedLead.number_status = 'completed';
      } else if (outcomeResult.required_condition === 'pending') {
        if (updatedLead.number_status !== 'completed') {
          updatedLead.number_status = 'pending';
        }
      } else if (outcomeResult.required_condition === 'not_completed' || !outcomeResult.phone_valid) {
        if (updatedLead.number_status !== 'completed') {
          updatedLead.number_status = 'failed';
        }
      } else {
        // 'not_discussed'
        if (updatedLead.number_status !== 'completed' && updatedLead.number_status !== 'pending' && updatedLead.number_status !== 'failed') {
          updatedLead.number_status = 'not_started';
        }
      }

      // 6. Participated status
      if (outcomeResult.participated) {
        updatedLead.participated_status = 'completed';
      } else if (outcomeResult.interest === 'not_interested') {
        if (updatedLead.participated_status !== 'completed') {
          updatedLead.participated_status = 'failed';
        }
      } else {
        if (updatedLead.participated_status !== 'completed' && updatedLead.participated_status !== 'failed') {
          updatedLead.participated_status = 'not_started';
        }
      }

      // 7. Email / feedback status (completing all steps)
      if (outcomeResult.final_outcome === 'completed') {
        updatedLead.email_status = 'completed';
      }

      // Calculate final status
      updatedLead.final_status = this.calculateFinalStatusFromState(updatedLead);
    } else {
      // Fallback to legacy parser logic if no outcomeResult provided
      const outcome = (event.outcome || '').toLowerCase();
      const summary = (event.summary || '').toLowerCase();
      const transcript = (event.transcript || '').toLowerCase();

      const isNotInterested =
        outcome.includes('not_interested') ||
        outcome.includes('declined') ||
        summary.includes('not interested') ||
        transcript.includes('not interested');

      const isCallSuccess = event.callStatus === 'completed' && event.outcome !== 'wrong_number' && !isNotInterested;

      if (isNotInterested) {
        updatedLead.agent_status = 'failed';
        updatedLead.participated_status = 'failed';
      } else {
        updatedLead.participated_status = 'completed';
        if (isCallSuccess) {
          updatedLead.agent_status = 'completed';
          updatedLead.cold_call_status = 'completed';
        }
      }

      if (event.numberValid === false || (event.callStatus === 'failed' && event.outcome?.includes('invalid'))) {
        updatedLead.number_status = 'failed';
      } else if (isCallSuccess) {
        updatedLead.number_status = 'completed';
      }

      if (event.callbackRequired) {
        updatedLead.followup_status = 'pending';
      }

      updatedLead.final_status = this.calculateFinalStatusFromState(updatedLead);
    }

    updatedLead.last_call_id = event.callId;
    updatedLead.last_activity = new Date().toISOString();
    return updatedLead;
  }

  /**
   * Deterministic Calculation of Final Status based on Lead State
   */
  public calculateFinalStatusFromState(lead: Lead): FinalStatus {
    // If they explicitly declined
    if (lead.participated_status === 'failed') {
      return 'Not Interested';
    }
    // If phone number is invalid
    if (lead.number_status === 'failed' && lead.cold_call_status === 'failed') {
      return 'Invalid Number';
    }
    // If completed
    if (lead.number_status === 'completed') {
      return 'Completed';
    }
    // If not completed (refused required condition)
    if (lead.number_status === 'failed') {
      return 'Not Completed';
    }
    // If participated
    if (lead.participated_status === 'completed') {
      return 'Participated';
    }
    // If follow-up pending
    if (lead.followup_status === 'pending') {
      return 'Follow-up Pending';
    }
    // If reminder pending
    if (lead.reminder_status === 'pending') {
      return 'Reminder Pending';
    }
    // If cold call failed (no answer)
    if (lead.cold_call_status === 'failed') {
      return 'No Answer';
    }
    // If agent call failed
    if (lead.agent_status === 'failed') {
      return 'Call Failed';
    }
    return 'Not Started';
  }
}

export const statusEngine = new StatusEngine();
