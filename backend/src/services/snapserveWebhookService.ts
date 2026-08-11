import { SnapServeNormalizedEvent } from '../types';

export class SnapServeWebhookService {
  /**
   * Normalizes incoming raw SnapServe payload into standard internal SnapServeNormalizedEvent format.
   * Combines all summary, notes, evidence, and transcript fields for complete AI audit evaluation.
   */
  public parseWebhookPayload(rawPayload: any): SnapServeNormalizedEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid payload: expected JSON object');
    }

    // Extract event type from payload
    const rawEvent =
      rawPayload.event ||
      rawPayload.event_type ||
      rawPayload.type ||
      rawPayload.action ||
      'call.completed';

    // Extract phone number from various potential paths
    const phone =
      rawPayload.phone ||
      rawPayload.phone_number ||
      rawPayload.toNumber ||
      rawPayload.to_number ||
      rawPayload.metadata?.callerKey ||
      rawPayload.metadata?.phone ||
      rawPayload.fields?.phone ||
      rawPayload.fields?.phone_number ||
      rawPayload.leadData?.phone_number ||
      rawPayload.customer?.phone ||
      rawPayload.customer_phone ||
      rawPayload.contact?.phone ||
      rawPayload.lead?.phone ||
      rawPayload.fromNumber ||
      rawPayload.from_number ||
      '';

    if (!phone) {
      throw new Error('Missing customer phone number in SnapServe webhook payload');
    }

    // Extract call identifier
    const callId = String(
      rawPayload.callId ||
      rawPayload.call_id ||
      rawPayload.fields?.callId ||
      rawPayload.id ||
      rawPayload.session_id ||
      `call_${Date.now()}`
    );

    // Extract agent ID
    const agentId =
      rawPayload.agentId ||
      rawPayload.agent_id ||
      rawPayload.bot_id ||
      rawPayload.assistant_id ||
      'agent_registration';

    // Determine call outcome / disposition
    const outcome = String(
      rawPayload.dispositionResult?.outcome ||
      rawPayload.dispositionResult?.sub ||
      rawPayload.disposition ||
      rawPayload.fields?.disposition ||
      rawPayload.fields?.status ||
      rawPayload.outcome ||
      rawPayload.call_analysis?.custom_analysis_data?.outcome ||
      rawPayload.result ||
      'completed'
    ).toLowerCase();

    // Determine call status
    const rawStatus = (
      rawPayload.call_status ||
      rawPayload.status ||
      rawPayload.disposition ||
      outcome ||
      'completed'
    ).toLowerCase();

    let callStatus: 'completed' | 'failed' | 'busy' | 'no_answer' | 'in_progress' = 'completed';
    if (rawStatus.includes('fail') || rawStatus.includes('error')) {
      callStatus = 'failed';
    } else if (rawStatus.includes('busy')) {
      callStatus = 'busy';
    } else if (rawStatus.includes('no_answer') || rawStatus.includes('unanswered')) {
      callStatus = 'no_answer';
    } else if (rawStatus.includes('progress') || rawStatus.includes('started')) {
      callStatus = 'in_progress';
    }

    // Extract duration (in seconds)
    let duration = 0;
    if (typeof rawPayload.durationSeconds === 'number') {
      duration = rawPayload.durationSeconds;
    } else if (typeof rawPayload.duration === 'number') {
      duration = rawPayload.duration;
    } else if (typeof rawPayload.duration_seconds === 'number') {
      duration = rawPayload.duration_seconds;
    } else if (typeof rawPayload.call_length === 'number') {
      duration = rawPayload.call_length;
    }

    // Combine ALL summary & notes sources (callSummary, fields.notes, dispositionResult.summary)
    const summaryParts = [
      rawPayload.callSummary,
      rawPayload.fields?.notes,
      rawPayload.dispositionResult?.summary,
      rawPayload.summary,
      rawPayload.call_summary,
      rawPayload.ai_summary,
      rawPayload.details,
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    const summary = Array.from(new Set(summaryParts)).join(' | ');

    // Combine ALL transcript & evidence sources (transcript, dispositionResult.evidence, dialogue)
    const transcriptParts = [
      rawPayload.transcript,
      rawPayload.dispositionResult?.evidence,
      rawPayload.call_transcript,
      rawPayload.dialogue,
      rawPayload.text,
      summary,
    ].filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    const transcript = Array.from(new Set(transcriptParts)).join(' | ');

    // Extract callback requirements
    const callbackRequired =
      rawPayload.callback_required ??
      rawPayload.requires_followup ??
      rawPayload.call_analysis?.custom_analysis_data?.callback_required ??
      Boolean(outcome.includes('callback') || outcome.includes('followup'));

    const callbackTime =
      rawPayload.callback_time ||
      rawPayload.scheduled_callback_time ||
      rawPayload.call_analysis?.custom_analysis_data?.callback_time ||
      undefined;

    // Contact info enrichment
    const name = rawPayload.name || rawPayload.leadData?.name || rawPayload.fields?.name || rawPayload.customer?.name || rawPayload.contact?.name;
    const email = rawPayload.email || rawPayload.fields?.email || rawPayload.customer?.email || rawPayload.contact?.email;

    return {
      event: rawEvent,
      callId,
      agentId: String(agentId),
      phone,
      name,
      email,
      callStatus,
      outcome,
      duration,
      transcript,
      summary,
      callbackRequired,
      callbackTime,
      numberValid: true,
      participated: !outcome.includes('not_interested') && !outcome.includes('declined'),
      timestamp: new Date().toISOString(),
      rawPayload,
    };
  }
}

export const snapserveWebhookService = new SnapServeWebhookService();
