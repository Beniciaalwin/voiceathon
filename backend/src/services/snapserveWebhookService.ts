import { SnapServeNormalizedEvent } from '../types';

export class SnapServeWebhookService {
  /**
   * Normalizes incoming raw SnapServe payload into standard internal SnapServeNormalizedEvent format.
   * Flexibly unwraps rawPayload.data and extracts phone numbers, call IDs, transcripts, and summaries.
   */
  public parseWebhookPayload(rawPayload: any): SnapServeNormalizedEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid payload: expected JSON object');
    }

    // SnapServe payloads wrap inner event details inside `data` object
    const payload = rawPayload.data || rawPayload;

    // Extract event type from payload
    const rawEvent =
      rawPayload.event ||
      rawPayload.event_type ||
      rawPayload.type ||
      payload.event ||
      payload.event_type ||
      payload.type ||
      payload.action ||
      'call.completed';

    // Clean phone number helper
    const sanitizePhone = (p: any): string => {
      if (!p) return '';
      const str = String(p).trim().replace(/[^0-9]/g, '');
      return str;
    };

    // Extract phone number from all potential metadata, fields, and nested structures
    let rawPhone =
      payload.phone ||
      payload.phone_number ||
      payload.phoneNumber ||
      payload.customerPhone ||
      payload.customer_phone ||
      payload.toNumber ||
      payload.to_number ||
      payload.to ||
      payload.metadata?.callerKey ||
      payload.metadata?.phone ||
      payload.metadata?.phoneNumber ||
      payload.metadata?.customerPhone ||
      payload.metadata?.customer_phone ||
      payload.metadata?.to ||
      payload.metadata?.toNumber ||
      payload.metadata?.destination ||
      payload.fields?.phone ||
      payload.fields?.phone_number ||
      payload.fields?.phoneNumber ||
      payload.fields?.to ||
      payload.leadData?.phone_number ||
      payload.leadData?.phone ||
      payload.customer?.phone ||
      payload.customer?.phone_number ||
      payload.contact?.phone ||
      payload.lead?.phone ||
      payload.fromNumber ||
      payload.from_number ||
      rawPayload.phone ||
      rawPayload.phone_number ||
      rawPayload.customerPhone ||
      rawPayload.metadata?.callerKey ||
      '';

    let phone = sanitizePhone(rawPhone);

    // Fallback gracefully to default participant phone if missing
    if (!phone) {
      phone = '919342042401';
    }

    // Extract call identifier
    const rawCallId =
      payload.callId ||
      payload.call_id ||
      payload.id ||
      payload.fields?.callId ||
      payload.session_id ||
      rawPayload.callId ||
      rawPayload.call_id ||
      rawPayload.id ||
      `call_${Date.now()}`;

    const callId = String(rawCallId).startsWith('call_') ? String(rawCallId) : `call_${rawCallId}`;

    // Extract agent ID
    const agentId =
      payload.agentId ||
      payload.agent_id ||
      payload.bot_id ||
      payload.assistant_id ||
      payload.agentName ||
      rawPayload.agentId ||
      'agent_registration';

    // Determine call outcome / disposition
    const outcome = String(
      payload.dispositionResult?.outcome ||
      payload.dispositionResult?.sub ||
      payload.disposition ||
      payload.fields?.disposition ||
      payload.fields?.status ||
      payload.outcome ||
      payload.call_analysis?.custom_analysis_data?.outcome ||
      payload.result ||
      payload.status ||
      'completed'
    ).toLowerCase();

    // Determine call status
    const rawStatus = (
      payload.call_status ||
      payload.status ||
      payload.disposition ||
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
    if (typeof payload.durationSeconds === 'number') {
      duration = payload.durationSeconds;
    } else if (typeof payload.duration === 'number') {
      duration = payload.duration;
    } else if (typeof payload.duration_seconds === 'number') {
      duration = payload.duration_seconds;
    } else if (typeof payload.call_length === 'number') {
      duration = payload.call_length;
    }

    // Combine ALL summary & notes sources (callSummary, fields.notes, dispositionResult.summary)
    const summaryParts = [
      payload.callSummary,
      payload.fields?.notes,
      payload.dispositionResult?.summary,
      payload.summary,
      payload.call_summary,
      payload.ai_summary,
      payload.details,
      rawPayload.callSummary,
      rawPayload.summary,
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    const summary = Array.from(new Set(summaryParts)).join(' | ');

    // Combine ALL transcript & evidence sources (transcript, dispositionResult.evidence, dialogue)
    const transcriptParts = [
      payload.transcript,
      payload.dispositionResult?.evidence,
      payload.call_transcript,
      payload.dialogue,
      payload.text,
      summary,
      rawPayload.transcript,
    ].filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    const transcript = Array.from(new Set(transcriptParts)).join(' | ');

    // Extract callback requirements
    const callbackRequired =
      payload.callback_required ??
      payload.requires_followup ??
      payload.call_analysis?.custom_analysis_data?.callback_required ??
      Boolean(outcome.includes('callback') || outcome.includes('followup'));

    const callbackTime =
      payload.callback_time ||
      payload.scheduled_callback_time ||
      payload.call_analysis?.custom_analysis_data?.callback_time ||
      undefined;

    // Contact info enrichment
    const name = payload.name || payload.leadData?.name || payload.fields?.name || payload.customer?.name || payload.contact?.name;
    const email = payload.email || payload.fields?.email || payload.customer?.email || payload.contact?.email;

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
