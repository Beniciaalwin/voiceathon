import { SnapServeNormalizedEvent } from '../types';

export class SnapServeWebhookService {
  /**
   * Normalizes incoming raw SnapServe payload into standard internal SnapServeNormalizedEvent format.
   * Handles variant JSON structures (Snake_case, camelCase, nested event payload objects, retell/vapi style payloads).
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
      rawPayload.to_number ||
      rawPayload.customer?.phone ||
      rawPayload.customer_phone ||
      rawPayload.contact?.phone ||
      rawPayload.lead?.phone ||
      '';

    if (!phone) {
      throw new Error('Missing customer phone number in SnapServe webhook payload');
    }

    // Extract call identifier
    const callId =
      rawPayload.call_id ||
      rawPayload.callId ||
      rawPayload.id ||
      rawPayload.session_id ||
      `call_${Date.now()}`;

    // Extract agent ID
    const agentId =
      rawPayload.agent_id ||
      rawPayload.agentId ||
      rawPayload.bot_id ||
      rawPayload.assistant_id ||
      'agent_snapserve_01';

    // Determine call status
    const rawStatus = (
      rawPayload.call_status ||
      rawPayload.status ||
      rawPayload.disposition ||
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

    // Determine call outcome
    const outcome =
      rawPayload.outcome ||
      rawPayload.call_analysis?.custom_analysis_data?.outcome ||
      rawPayload.disposition ||
      rawPayload.result ||
      (callStatus === 'completed' ? 'completed' : 'failed');

    // Extract duration (in seconds)
    let duration = 0;
    if (typeof rawPayload.duration === 'number') {
      duration = rawPayload.duration;
    } else if (typeof rawPayload.duration_seconds === 'number') {
      duration = rawPayload.duration_seconds;
    } else if (typeof rawPayload.call_length === 'number') {
      duration = rawPayload.call_length;
    }

    // Extract transcript
    const transcript =
      rawPayload.transcript ||
      rawPayload.call_transcript ||
      rawPayload.transcript_text ||
      rawPayload.concatenated_transcript ||
      rawPayload.dialogue ||
      rawPayload.text ||
      '';

    // Extract summary
    const summary =
      rawPayload.summary ||
      rawPayload.call_summary ||
      rawPayload.summary_text ||
      rawPayload.call_analysis?.call_summary ||
      rawPayload.call_analysis?.summary ||
      rawPayload.analysis?.summary ||
      rawPayload.ai_summary ||
      rawPayload.details ||
      '';

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
    const name = rawPayload.name || rawPayload.customer?.name || rawPayload.contact?.name;
    const email = rawPayload.email || rawPayload.customer?.email || rawPayload.contact?.email;

    return {
      event: rawEvent,
      callId,
      phone,
      name,
      email,
      agentId,
      callType: rawPayload.call_type || 'outbound_ai_call',
      callStatus,
      outcome,
      duration,
      transcript,
      summary,
      callbackRequired,
      callbackTime,
      numberValid: rawPayload.number_valid ?? true,
      participated: rawPayload.participated ?? (duration > 15),
      emailSent: rawPayload.email_sent ?? false,
      timestamp: rawPayload.timestamp || new Date().toISOString(),
      rawPayload,
    };
  }

  /**
   * Simple signature verification for security headers (optional secret matching)
   */
  public verifySignature(reqHeaders: any, rawBody: string, secret?: string): boolean {
    if (!secret) return true; // If no secret configured, allow requests in dev mode
    const signature = reqHeaders['x-snapserve-signature'] || reqHeaders['x-webhook-secret'];
    if (!signature) return false;
    return signature === secret;
  }
}

export const snapserveWebhookService = new SnapServeWebhookService();
