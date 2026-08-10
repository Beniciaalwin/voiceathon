import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
          onUpdate({ event: 'LEAD_UPDATED', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_logs' },
        (payload) => {
          onUpdate({ event: 'CALL_LOG_ADDED', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          onUpdate({ event: 'WEBHOOK_LOGGED', payload: payload.new });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  } else {
    // Fallback WebSocket subscription
    console.log('[WebSocket Realtime] Connecting to backend ws://...');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:4000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let ws: WebSocket | null = null;
    let timerId: any = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event) {
            onUpdate(data);
          }
        } catch (e) {
          // ignore non-json
        }
      };

      ws.onclose = () => {
        // Reconnect after 3s if closed
        timerId = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (ws) ws.close();
    };
  }
}
