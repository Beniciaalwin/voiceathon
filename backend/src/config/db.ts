import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Lead, CallLog, Activity, WebhookLog, DashboardStats } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  supabaseKey &&
  supabaseKey.length > 10
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (isSupabaseConfigured) {
  console.log('[DB] Connected to Supabase PostgreSQL Client');
} else {
  console.log('[DB] Running in Stateful In-Memory Fallback Mode (Seed Enabled)');
}

// In-Memory Database Store (Used when Supabase credentials are empty or fallback is active)
class InMemoryDB {
  private leads: Map<string, Lead> = new Map();
  private callLogs: CallLog[] = [];
  private activities: Activity[] = [];
  private webhookLogs: WebhookLog[] = [];
  private listeners: Array<(event: string, payload: any) => void> = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const lead1: Lead = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Arun Kumar',
      phone: '+919876543210',
      email: 'arun.k@gmail.com',
      agent_id: 'agent_snapserve_01',
      campaign: 'Voiceathon 2026 Main',
      agent_status: 'completed',
      cold_call_status: 'completed',
      followup_status: 'pending',
      reminder_status: 'not_started',
      number_status: 'completed',
      participated_status: 'not_started',
      email_status: 'completed',
      final_status: 'Follow-up Pending',
      last_call_id: 'call_arun_101',
      last_activity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    };

    const lead2: Lead = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Priya Sharma',
      phone: '+919712345678',
      email: 'priya.s@gmail.com',
      agent_id: 'agent_snapserve_01',
      campaign: 'Voiceathon 2026 Main',
      agent_status: 'completed',
      cold_call_status: 'completed',
      followup_status: 'completed',
      reminder_status: 'completed',
      number_status: 'completed',
      participated_status: 'completed',
      email_status: 'completed',
      final_status: 'Completed',
      last_call_id: 'call_priya_102',
      last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    };

    const lead3: Lead = {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Karthik Raja',
      phone: '+919698765432',
      email: 'karthik.r@gmail.com',
      agent_id: 'agent_snapserve_02',
      campaign: 'AI Agents Track',
      agent_status: 'not_started',
      cold_call_status: 'not_started',
      followup_status: 'not_started',
      reminder_status: 'not_started',
      number_status: 'failed',
      participated_status: 'not_started',
      email_status: 'not_started',
      final_status: 'Not Started',
      last_activity: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    };

    this.leads.set(lead1.id, lead1);
    this.leads.set(lead2.id, lead2);
    this.leads.set(lead3.id, lead3);

    this.callLogs.push(
      {
        id: 'call_log_1',
        lead_id: lead1.id,
        call_id: 'call_arun_101',
        agent_id: 'agent_snapserve_01',
        call_type: 'outbound_ai_call',
        call_status: 'completed',
        outcome: 'callback_requested',
        duration: 154,
        transcript: 'AI: Hello Arun, calling from SnapServe regarding your Voice AI inquiry.\nArun: Hi yes, I want to learn more about pricing and integration.\nAI: Great! I can schedule a technical demo for tomorrow.\nArun: Sure, please call me back tomorrow at 3 PM.',
        summary: 'Lead expressed strong interest in SnapServe pricing and CRM integration. Requested a scheduled callback tomorrow at 3:00 PM.',
        callback_required: true,
        callback_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'call_log_2',
        lead_id: lead2.id,
        call_id: 'call_priya_102',
        agent_id: 'agent_snapserve_01',
        call_type: 'outbound_ai_call',
        call_status: 'completed',
        outcome: 'completed',
        duration: 210,
        transcript: 'AI: Hi Priya, following up on your demo request.\nPriya: Thanks! The demo was super clear. We are ready to sign up.\nAI: Wonderful! Sending over the onboarding email right away.',
        summary: 'Lead confirmed plan selection after AI call consultation. Onboarding email sent and verified.',
        callback_required: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      }
    );

    this.activities.push(
      {
        id: 'act_1',
        lead_id: lead1.id,
        call_id: 'call_arun_101',
        activity_type: 'ai_call_completed',
        status: 'completed',
        description: 'AI Call completed (Duration: 2m 34s)',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_2',
        lead_id: lead1.id,
        call_id: 'call_arun_101',
        activity_type: 'followup_requested',
        status: 'pending',
        description: 'Follow-up requested by lead for pricing & integration',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_3',
        lead_id: lead2.id,
        call_id: 'call_priya_102',
        activity_type: 'ai_call_completed',
        status: 'completed',
        description: 'AI Call completed (Duration: 3m 30s)',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      }
    );

    this.webhookLogs.push({
      id: 'wh_log_1',
      event_type: 'call.completed',
      call_id: 'call_arun_101',
      phone: '+919876543210',
      status: 'Processed',
      raw_payload: { event: 'call.completed', call_id: 'call_arun_101', phone: '+919876543210' },
      received_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
  }

  public subscribe(fn: (event: string, payload: any) => void) {
    this.listeners.push(fn);
  }

  private notify(event: string, payload: any) {
    this.listeners.forEach((fn) => fn(event, payload));
  }

  public getLeads(query?: { search?: string; status?: string; campaign?: string; agent?: string; sortBy?: string }): Lead[] {
    let list = Array.from(this.leads.values());

    if (query?.search) {
      const s = query.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.phone.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s)
      );
    }

    if (query?.status && query.status !== 'all') {
      list = list.filter((l) => l.final_status === query.status);
    }

    if (query?.campaign && query.campaign !== 'all') {
      list = list.filter((l) => l.campaign === query.campaign);
    }

    if (query?.agent && query.agent !== 'all') {
      list = list.filter((l) => l.agent_id === query.agent);
    }

    const sortBy = query?.sortBy || 'last_activity';
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'final_status') return a.final_status.localeCompare(b.final_status);
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    });

    return list;
  }

  public getLeadById(id: string): Lead | undefined {
    return this.leads.get(id);
  }

  public findLeadByPhoneOrEmail(phone: string, email?: string): Lead | undefined {
    const cleanedPhone = phone.replace(/\D/g, '');
    for (const lead of this.leads.values()) {
      const p = lead.phone.replace(/\D/g, '');
      if (p && cleanedPhone && (p.includes(cleanedPhone) || cleanedPhone.includes(p))) {
        return lead;
      }
      if (email && lead.email.toLowerCase() === email.toLowerCase()) {
        return lead;
      }
    }
    return undefined;
  }

  public saveLead(lead: Lead): Lead {
    lead.updated_at = new Date().toISOString();
    this.leads.set(lead.id, lead);
    this.notify('LEAD_UPDATED', lead);
    return lead;
  }

  public addCallLog(log: Omit<CallLog, 'id' | 'created_at'>): CallLog {
    const newLog: CallLog = {
      ...log,
      id: 'call_log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    this.callLogs.unshift(newLog);
    this.notify('CALL_LOG_ADDED', newLog);
    return newLog;
  }

  public getCallLogsByLeadId(leadId: string): CallLog[] {
    return this.callLogs
      .filter((c) => c.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addActivity(act: Omit<Activity, 'id' | 'created_at'>): Activity {
    const newAct: Activity = {
      ...act,
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };
    this.activities.unshift(newAct);
    this.notify('ACTIVITY_ADDED', newAct);
    return newAct;
  }

  public getActivitiesByLeadId(leadId: string): Activity[] {
    return this.activities
      .filter((a) => a.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addWebhookLog(log: Omit<WebhookLog, 'id' | 'received_at'>): WebhookLog {
    const newLog: WebhookLog = {
      ...log,
      id: 'wh_' + Date.now(),
      received_at: new Date().toISOString(),
    };
    this.webhookLogs.unshift(newLog);
    this.notify('WEBHOOK_LOGGED', newLog);
    return newLog;
  }

  public getWebhookLogs(): WebhookLog[] {
    return this.webhookLogs.slice(0, 50);
  }

  public getStats(): DashboardStats {
    const allLeads = Array.from(this.leads.values());
    const totalLeads = allLeads.length;
    const callsCompleted = this.callLogs.filter((c) => c.call_status === 'completed').length;
    const followupsPending = allLeads.filter((l) => l.final_status === 'Follow-up Pending').length;
    const completed = allLeads.filter((l) => l.final_status === 'Completed').length;
    const failedCalls = allLeads.filter((l) => l.final_status === 'Call Failed' || l.cold_call_status === 'failed').length;

    return {
      totalLeads,
      callsCompleted,
      followupsPending,
      completed,
      failedCalls,
    };
  }

  public seedReset() {
    this.leads.clear();
    this.callLogs = [];
    this.activities = [];
    this.webhookLogs = [];
    this.seed();
    this.notify('DATA_RESET', {});
  }
}

export const inMemoryDB = new InMemoryDB();
