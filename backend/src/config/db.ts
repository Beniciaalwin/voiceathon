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
    // No dummy sample data — start clean to display real SnapServe webhooks exclusively
    this.leads.clear();
    this.callLogs = [];
    this.activities = [];
    this.webhookLogs = [];
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
