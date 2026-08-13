import { Request, Response } from 'express';
import { isSupabaseConfigured, supabase, inMemoryDB } from '../config/db';
import { snapserveWebhookService } from '../services/snapserveWebhookService';
import { llmSummaryParser } from '../services/llmSummaryParser';
import { statusEngine } from '../services/statusEngine';
import { Lead } from '../types';

export class WebhookController {
  public handleSnapServeWebhook = async (req: Request, res: Response): Promise<void> => {
    const rawPayload = req.body;
    const receivedAt = new Date().toISOString();

    console.log('[Webhook Received]', JSON.stringify(rawPayload));

    // Handle Ping / URL Healthcheck requests gracefully without logging errors
    if (
      !rawPayload ||
      Object.keys(rawPayload).length === 0 ||
      rawPayload.event === 'ping' ||
      rawPayload.type === 'ping' ||
      rawPayload.action === 'ping'
    ) {
      res.status(200).json({ success: true, message: 'SnapServe webhook endpoint active' });
      return;
    }

    let normalizedEvent;
    try {
      // 1. Normalize SnapServe payload (unwrapping data if nested)
      normalizedEvent = snapserveWebhookService.parseWebhookPayload(rawPayload);
    } catch (err: any) {
      console.error('[Webhook Parse Error]', err.message);

      // Log failed webhook
      const failedLog = {
        event_type: rawPayload?.event || 'unknown',
        call_id: rawPayload?.call_id || rawPayload?.id,
        phone: rawPayload?.phone || rawPayload?.phone_number,
        status: 'Failed' as const,
        error_message: err.message,
        raw_payload: rawPayload,
      };

      if (isSupabaseConfigured && supabase) {
        await supabase.from('webhook_logs').insert(failedLog);
      } else {
        inMemoryDB.addWebhookLog(failedLog);
      }

      res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: err.message,
      });
      return;
    }

    try {
      // 2. Parse Summary into Verified LLM Sub-Checklist Ticks (Groq LLM / Fallback)
      const llmTicks = await llmSummaryParser.parseSummaryToTicks(
        normalizedEvent.summary,
        normalizedEvent.transcript,
        normalizedEvent.agentId,
        rawPayload
      );

      // 3. Robust Lead Matching by last 10 digits of phone or email
      let lead: Lead | null = null;
      const phoneDigits = (normalizedEvent.phone || '').replace(/[^0-9]/g, '');
      const last10Digits = phoneDigits.slice(-10);

      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('leads').select('*');
        if (last10Digits.length >= 7) {
          query = query.or(`phone.ilike.%${last10Digits}%`);
        } else if (normalizedEvent.email) {
          query = query.eq('email', normalizedEvent.email);
        }
        const { data: existingLeads } = await query;

        if (existingLeads && existingLeads.length > 0) {
          lead = existingLeads[0] as Lead;
        }
      } else {
        lead = inMemoryDB.findLeadByPhoneOrEmail(normalizedEvent.phone, normalizedEvent.email) || null;
      }

      // Create new lead if not existing
      if (!lead) {
        const newLeadData: Partial<Lead> = {
          name: normalizedEvent.name || `Participant (${normalizedEvent.phone.slice(-4)})`,
          phone: normalizedEvent.phone,
          email: normalizedEvent.email || `participant_${Date.now()}@example.com`,
          agent_id: normalizedEvent.agentId,
          campaign: 'Voiceathon 2026 Main',
          agent_status: normalizedEvent.callStatus === 'completed' ? 'completed' : 'failed',
          cold_call_status: 'not_started',
          followup_status: 'not_started',
          reminder_status: 'not_started',
          number_status: normalizedEvent.callStatus === 'completed' ? 'completed' : 'failed',
          participated_status: 'not_started',
          email_status: 'not_started',
          final_status: 'Not Started',
          last_activity: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          try {
            const { data: insertedLead } = await supabase
              .from('leads')
              .insert(newLeadData)
              .select()
              .single();
            lead = insertedLead as Lead;
          } catch (e) {
            console.error('[Supabase Lead Insert Error] Using fallback lead instance:', e);
          }
        }
        
        if (!lead) {
          lead = inMemoryDB.saveLead({
            ...newLeadData,
            id: '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0').slice(-12),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Lead);
        }
      }

      // 4. Evaluate new lead status via StatusEngine
      const updatedLead = statusEngine.evaluateLeadStatus(lead, normalizedEvent);
      updatedLead.last_activity = new Date().toISOString();
      updatedLead.updated_at = new Date().toISOString();

      // 5. Save updated lead
      if (isSupabaseConfigured && supabase) {
        await supabase.from('leads').update(updatedLead).eq('id', lead.id);
      } else {
        inMemoryDB.saveLead(updatedLead);
      }

      // 6. Store Call Log (with LLM extracted ticks embedded)
      const enrichedPayload = {
        ...rawPayload,
        llm_ticks: llmTicks,
      };

      const callLogData = {
        lead_id: lead.id,
        call_id: normalizedEvent.callId,
        agent_id: normalizedEvent.agentId,
        call_type: normalizedEvent.callType || 'outbound_ai_call',
        call_status: normalizedEvent.callStatus,
        outcome: normalizedEvent.outcome,
        duration: normalizedEvent.duration || 0,
        transcript: normalizedEvent.transcript || '',
        summary: normalizedEvent.summary || '',
        callback_required: normalizedEvent.callbackRequired || false,
        callback_time: normalizedEvent.callbackTime || null,
        raw_webhook_data: enrichedPayload,
      };

      if (isSupabaseConfigured && supabase) {
        await supabase.from('call_logs').insert(callLogData);
      } else {
        inMemoryDB.addCallLog(callLogData as any);
      }

      // 7. Create Activity Timeline entry
      let activityDesc = `AI Call ${normalizedEvent.callStatus} (${normalizedEvent.agentId})`;
      if (normalizedEvent.duration) {
        const mins = Math.floor(normalizedEvent.duration / 60);
        const secs = normalizedEvent.duration % 60;
        activityDesc += ` (Duration: ${mins}m ${secs}s)`;
      }
      if (normalizedEvent.callbackRequired) {
        activityDesc += ` - Follow-up Requested`;
      }

      const activityData = {
        lead_id: lead.id,
        call_id: normalizedEvent.callId,
        activity_type: normalizedEvent.event,
        status: normalizedEvent.callStatus === 'completed' ? ('completed' as const) : ('failed' as const),
        description: activityDesc,
      };

      if (isSupabaseConfigured && supabase) {
        await supabase.from('activities').insert(activityData);
      } else {
        inMemoryDB.addActivity(activityData as any);
      }

      // 8. Log Successful Webhook
      const webhookLogData = {
        event_type: normalizedEvent.event,
        call_id: normalizedEvent.callId,
        phone: normalizedEvent.phone,
        status: 'Processed' as const,
        raw_payload: rawPayload,
      };

      if (isSupabaseConfigured && supabase) {
        await supabase.from('webhook_logs').insert(webhookLogData);
      } else {
        inMemoryDB.addWebhookLog(webhookLogData);
      }

      console.log(`[Webhook Processed Successfully] Lead ID: ${lead.id}, Phone: ${normalizedEvent.phone}`);

      res.status(200).json({
        success: true,
        message: 'SnapServe webhook processed successfully',
        leadId: lead.id,
        finalStatus: updatedLead.final_status,
      });
    } catch (err: any) {
      console.error('[Webhook Controller Critical Error]', err);

      // Log failed webhook to DB
      const failedLog = {
        event_type: normalizedEvent?.event || rawPayload?.event || 'unknown',
        call_id: normalizedEvent?.callId || rawPayload?.call_id,
        phone: normalizedEvent?.phone || rawPayload?.phone,
        status: 'Failed' as const,
        error_message: err.message,
        raw_payload: rawPayload,
      };

      if (isSupabaseConfigured && supabase) {
        await supabase.from('webhook_logs').insert(failedLog);
      } else {
        inMemoryDB.addWebhookLog(failedLog);
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error processing webhook',
        details: err.message,
      });
    }
  };

  public getWebhookLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('webhook_logs')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(50);

          if (!error && data) {
            res.json({ success: true, logs: data });
            return;
          }
        } catch (dbErr: any) {
          console.warn('[Supabase WebhookLogs Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const logs = inMemoryDB.getWebhookLogs();
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export const webhookController = new WebhookController();
