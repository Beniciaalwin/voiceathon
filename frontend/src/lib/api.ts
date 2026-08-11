import { Lead, CallLog, Activity, WebhookLog, DashboardStats } from '../types/index';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://voiceathon-backend.onrender.com');

export async function fetchLeads(params?: {
  search?: string;
  status?: string;
  campaign?: string;
  agent?: string;
  sortBy?: string;
}): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.campaign) query.append('campaign', params.campaign);
  if (params?.agent) query.append('agent', params.agent);
  if (params?.sortBy) query.append('sortBy', params.sortBy);

  const res = await fetch(`${API_BASE_URL}/api/leads?${query.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch leads');
  return json.leads;
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const res = await fetch(`${API_BASE_URL}/api/leads/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch lead');
  return json.lead;
}

export async function fetchLeadCalls(id: string): Promise<CallLog[]> {
  const res = await fetch(`${API_BASE_URL}/api/leads/${id}/calls`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch call logs');
  return json.calls;
}

export async function fetchLeadActivities(id: string): Promise<Activity[]> {
  const res = await fetch(`${API_BASE_URL}/api/leads/${id}/activities`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activities');
  return json.activities;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch stats');
  return json.stats;
}

export async function fetchWebhookLogs(): Promise<WebhookLog[]> {
  const res = await fetch(`${API_BASE_URL}/api/webhooks/logs`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch webhook logs');
  return json.logs;
}

export async function triggerSimulatedWebhook(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/webhooks/snapserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
