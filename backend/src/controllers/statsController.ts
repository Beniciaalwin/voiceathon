import { Request, Response } from 'express';
import { isSupabaseConfigured, supabase, inMemoryDB } from '../config/db';

export class StatsController {
  public getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        // Query database stats
        const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        const { count: callsCompleted } = await supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('call_status', 'completed');
        const { count: followupsPending } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('final_status', 'Follow-up Pending');
        const { count: completed } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('final_status', 'Completed');
        const { count: failedCalls } = await supabase.from('leads').select('*', { count: 'exact', head: true }).or('final_status.eq.Call Failed,cold_call_status.eq.failed');

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
      } else {
        const stats = inMemoryDB.getStats();
        res.json({ success: true, stats });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export const statsController = new StatsController();
