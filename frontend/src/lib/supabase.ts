import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://qubngelwtqlwnooqweim.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LBmVXWNTb7I_OMV6GEyYXw_SyAPV9VZ';

export const isSupabaseFrontendConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 10
);

export const supabaseClient: SupabaseClient | null = isSupabaseFrontendConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Realtime Subscription Abstraction
 * Listens via Supabase Realtime when available, or via Backend WebSocket in local fallback mode.
 */
export function subscribeToRealtimeUpdates(onUpdate: (payload: { event: string; payload: any }) => void) {
  if (isSupabaseFrontendConfigured && supabaseClient) {
    console.log('[Supabase Realtime] Subscribing to postgres_changes...');

    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('[Supabase Realtime] Leads table change:', payload);
          onUpdate({ event: 'LEAD_UPDATED', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_logs' },
        (payload) => {
          console.log('[Supabase Realtime] Call log inserted:', payload);
          onUpdate({ event: 'CALL_LOG_ADDED', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          console.log('[Supabase Realtime] Webhook logged:', payload);
          onUpdate({ event: 'WEBHOOK_LOGGED', payload: payload.new });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  } else {
    // Fallback Backend WebSocket subscription
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:4000' : 'voiceathon-backend.onrender.com';
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('[WebSocket Realtime] Connecting to:', wsUrl);
    let ws: WebSocket | null = null;
    let timerId: any = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Realtime] Connected successfully');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onUpdate(data);
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        timerId = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (timerId) clearTimeout(timerId);
      ws?.close();
    };
  }
}
