import { Request, Response } from 'express';
import { isSupabaseConfigured, supabase, inMemoryDB } from '../config/db';
import { analyzeCallWithLLM } from '../services/llmAnalysisService';
import { analyzeCallOutcomeWithLLM } from '../services/llmOutcomeService';
import { statusEngine } from '../services/statusEngine';

export class StatsController {
  public getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { count: totalLeads, error: e1 } = await supabase.from('leads').select('*', { count: 'exact', head: true });
          if (e1) throw e1;

          const { count: callsCompleted } = await supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('call_status', 'completed');
          const { count: followupsPending } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('final_status', 'Follow-up Pending');
          const { count: completed } = await supabase.from('leads').select('*', { count: 'exact', head: true }).or('final_status.eq.Participated,final_status.eq.Completed');
          const { count: failedCalls } = await supabase.from('leads').select('*', { count: 'exact', head: true }).or('final_status.eq.Call Failed,final_status.eq.Invalid Number,agent_status.eq.failed');

          res.json({
            success: true,
            stats: {
              totalLeads: totalLeads || 0,
              callsCompleted: callsCompleted || 0,
              followupsPending: followupsPending || 0,
              completed: completed || 0,
              failedCalls: failedCalls || 0,
            },
          });
          return;
        } catch (dbErr: any) {
          console.warn('[Supabase Stats Query Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const stats = inMemoryDB.getStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // Extract real name from AI-generated call summary text
  private extractNameFromSummary(summary: string): string | null {
    if (!summary) return null;
    // "The customer, John Smith, called..." or "customer John called..."
    const patterns = [
      /(?:customer|caller)[,]?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,\s]/,
      /(?:called|greeted)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,\s]/,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:registered|confirmed|mentioned|said|asked|stated)\b/,
    ];
    for (const pat of patterns) {
      const m = summary.match(pat);
      if (m && m[1] && m[1].length > 2 && !['The','This','They','He','She','We','Our','Its','And','But','For'].includes(m[1])) {
        return m[1];
      }
    }
    return null;
  }

  public getParticipantIntel = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        res.json({ success: true, participants: [] });
        return;
      }

      // Fetch all call logs with summary
      const { data: logs } = await supabase
        .from('call_logs')
        .select('lead_id, summary, raw_webhook_data, created_at')
        .order('created_at', { ascending: false });

      if (!logs || logs.length === 0) {
        res.json({ success: true, participants: [] });
        return;
      }

      // Group by lead_id — latest log per lead
      const byLead: Record<string, any> = {};
      for (const log of logs) {
        if (!byLead[log.lead_id]) byLead[log.lead_id] = log;
      }

      // Fetch leads
      const leadIds = Object.keys(byLead);
      const { data: leads } = await supabase.from('leads').select('id, name, phone').in('id', leadIds);
      const leadMap: Record<string, any> = Object.fromEntries((leads || []).map((l: any) => [l.id, l]));

      const participants = leadIds.map(lid => {
        const log = byLead[lid];
        const lead = leadMap[lid] || {};
        const phone = lead.phone || 'unknown';
        const summary = log.summary || '';
        const ticks = log.raw_webhook_data?.llm_ticks || {};
        const allTicks = { ...(ticks.agent1 || {}), ...(ticks.agent2 || {}), ...(ticks.agent3 || {}) };

        const phoneBought: string = allTicks.phoneNumberPurchased || allTicks.phonePurchased || 'unknown';
        const agentBuild: string = allTicks.agentBuildCompleted || allTicks.agentBuildStarted || 'unknown';

        const realName = this.extractNameFromSummary(summary) || null;
        const isGeneric = /^Participant\s*\(/i.test(lead.name || '');
        const displayName = (!isGeneric && lead.name) ? lead.name : (realName || null);

        // Format phone: 91XXXXXXXXXX → +91 XXXXX XXXXX
        const formattedPhone = phone && phone.length >= 10
          ? `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`
          : phone;

        const summarySnippet = summary.length > 180 ? summary.substring(0, 180) + '…' : summary;

        return {
          leadId: lid,
          phone,
          formattedPhone,
          displayName,
          phoneBought,
          agentBuild,
          summarySnippet,
          callTime: log.created_at,
        };
      }).filter(p => p.summarySnippet && p.summarySnippet.trim().length > 20); // Only show leads with real summaries

      // Sort: phone bought first, then agent build, then rest
      participants.sort((a, b) => {
        const score = (p: any) =>
          (p.phoneBought === 'verified' ? 100 : 0) +
          (p.agentBuild === 'verified' ? 50 : 0) +
          (p.displayName ? 10 : 0);
        return score(b) - score(a);
      });

      res.json({ success: true, participants });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  public analyzeAllCalls = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        res.json({ success: true, results: [], message: 'Supabase not configured' });
        return;
      }

      // Fetch all call logs
      const { data: logs, error } = await supabase
        .from('call_logs')
        .select('lead_id, summary, transcript, duration, raw_webhook_data')
        .order('created_at', { ascending: false });

      if (error || !logs) {
        res.status(500).json({ success: false, error: error?.message || 'No data' });
        return;
      }

      // Fetch lead phone numbers
      const leadIds = [...new Set(logs.map((l: any) => l.lead_id))];
      const { data: leads } = await supabase.from('leads').select('id, phone').in('id', leadIds);
      const leadPhoneMap: Record<string, string> = Object.fromEntries(
        (leads || []).map((l: any) => [l.id, l.phone])
      );

      // Latest log per lead only (avoid duplicate processing)
      const byLead: Record<string, any> = {};
      for (const log of logs) {
        if (!byLead[log.lead_id]) byLead[log.lead_id] = log;
      }

      // Run LLM analysis on each lead in parallel (batches of 5)
      const entries = Object.entries(byLead);
      const results = [];
      const BATCH = 5;

      for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        const batchResults = await Promise.all(
          batch.map(([leadId, log]) =>
            analyzeCallWithLLM(
              leadId,
              leadPhoneMap[leadId] || 'unknown',
              log.raw_webhook_data || {},
              log.duration || 0,
              log.transcript || '',
              log.summary || ''
            )
          )
        );
        results.push(...batchResults);
      }

      // Sort: most actionable first
      results.sort((a, b) => {
        const score = (r: any) =>
          (r.phoneBought === 'yes' ? 100 : 0) +
          (r.agentBuild === 'completed' ? 80 : r.agentBuild === 'in_progress' ? 40 : 0) +
          (r.interest === 'interested' ? 20 : 0) +
          (r.interest === 'not_interested' ? -50 : 0) +
          (r.callDropped ? -30 : 0);
        return score(b) - score(a);
      });

      const summary = {
        total: results.length,
        interested: results.filter(r => r.interest === 'interested').length,
        notInterested: results.filter(r => r.interest === 'not_interested').length,
        callDropped: results.filter(r => r.callDropped).length,
        phoneBought: results.filter(r => r.phoneBought === 'yes').length,
        agentCompleted: results.filter(r => r.agentBuild === 'completed').length,
        agentInProgress: results.filter(r => r.agentBuild === 'in_progress').length,
        needsFollowUp: results.filter(r => r.followUpNeeded).length,
      };

      res.json({ success: true, summary, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public reanalyzeAllHistoricalCalls = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        res.json({ success: true, message: 'Supabase not configured' });
        return;
      }

      const client = supabase!;

      // Fetch all call logs in chronological order (ascending) to reconstruct state correctly
      const { data: logs, error: errLogs } = await client
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: true });

      if (errLogs || !logs) {
        throw new Error(errLogs?.message || 'Failed to fetch call logs');
      }

      console.log(`[Re-analysis] Processing ${logs.length} call logs...`);

      // Run LLM analysis in batches of 5 to avoid overloading Groq API
      const BATCH_SIZE = 5;
      const analyzedLogs = [];

      for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const batch = logs.slice(i, i + BATCH_SIZE);
        console.log(`[Re-analysis] Batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
        
        const batchResults = await Promise.all(
          batch.map(async (log: any) => {
            const outcomeResult = await analyzeCallOutcomeWithLLM(
              log.duration || 0,
              log.call_status || 'completed',
              log.outcome || '',
              log.transcript || '',
              log.summary || '',
              log.agent_id || ''
            );

            // Update call log raw_webhook_data.llm_outcome in Supabase
            const updatedRawData = {
              ...(log.raw_webhook_data || {}),
              llm_outcome: outcomeResult,
            };

            await client
              .from('call_logs')
              .update({ raw_webhook_data: updatedRawData })
              .eq('id', log.id);

            return {
              ...log,
              raw_webhook_data: updatedRawData,
              llm_outcome: outcomeResult,
            };
          })
        );
        analyzedLogs.push(...batchResults);
      }

      // Fetch all leads
      const { data: leads, error: errLeads } = await client.from('leads').select('*');
      if (errLeads || !leads) {
        throw new Error(errLeads?.message || 'Failed to fetch leads');
      }

      console.log(`[Re-analysis] Reconstructing status for ${leads.length} leads...`);

      // Reconstruct lead states
      for (const lead of leads) {
        // Find all analyzed logs for this lead in chronological order
        const leadLogs = analyzedLogs.filter(log => log.lead_id === lead.id);

        if (leadLogs.length === 0) {
          // Reset status to Not Started if no calls
          await client
            .from('leads')
            .update({
              agent_status: 'not_started',
              cold_call_status: 'not_started',
              followup_status: 'not_started',
              reminder_status: 'not_started',
              number_status: 'not_started',
              participated_status: 'not_started',
              email_status: 'not_started',
              final_status: 'Not Started',
            })
            .eq('id', lead.id);
          continue;
        }

        // Initialize clean lead object for state rebuild
        let currentLeadState = {
          ...lead,
          agent_status: 'not_started' as any,
          cold_call_status: 'not_started' as any,
          followup_status: 'not_started' as any,
          reminder_status: 'not_started' as any,
          number_status: 'not_started' as any,
          participated_status: 'not_started' as any,
          email_status: 'not_started' as any,
          final_status: 'Not Started' as any,
        };

        // Sequentially evaluate each call
        for (const log of leadLogs) {
          const mockEvent = {
            event: 'call.completed',
            callId: log.call_id,
            phone: lead.phone,
            agentId: log.agent_id,
            callStatus: log.call_status,
            outcome: log.outcome,
            duration: log.duration,
            transcript: log.transcript,
            summary: log.summary,
            callbackRequired: log.callback_required,
            callbackTime: log.callback_time,
            timestamp: log.created_at,
            rawPayload: log.raw_webhook_data,
          };

          currentLeadState = statusEngine.evaluateLeadStatus(
            currentLeadState,
            mockEvent,
            log.llm_outcome
          );
        }

        // Save final updated lead state to Supabase
        await client
          .from('leads')
          .update({
            agent_status: currentLeadState.agent_status,
            cold_call_status: currentLeadState.cold_call_status,
            followup_status: currentLeadState.followup_status,
            reminder_status: currentLeadState.reminder_status,
            number_status: currentLeadState.number_status,
            participated_status: currentLeadState.participated_status,
            email_status: currentLeadState.email_status,
            final_status: currentLeadState.final_status,
            last_activity: currentLeadState.last_activity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
      }

      res.json({
        success: true,
        message: `Successfully re-analyzed all ${analyzedLogs.length} call logs and updated status for ${leads.length} leads.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export const statsController = new StatsController();
