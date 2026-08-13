import { Request, Response } from 'express';
import { isSupabaseConfigured, supabase, inMemoryDB } from '../config/db';

export class LeadController {
  public getLeads = async (req: Request, res: Response): Promise<void> => {
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const campaign = (req.query.campaign as string) || 'all';
    const agent = (req.query.agent as string) || 'all';
    const sortBy = (req.query.sortBy as string) || 'last_activity';

    try {
      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('leads').select('*');

          if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
          }

          // For smart filters — fetch qualifying lead IDs from call_logs llm_ticks
          if (status === 'build_not_started' || status === 'phone_pending' || status === 'ready' || status === 'not_interested_filter') {
            const { data: callLogs } = await supabase
              .from('call_logs')
              .select('lead_id, raw_webhook_data, duration');

            if (callLogs && callLogs.length > 0) {
              // Latest log per lead
              const byLead: Record<string, any> = {};
              for (const log of callLogs) {
                if (!byLead[log.lead_id]) byLead[log.lead_id] = log;
              }

              let matchingIds: string[] = [];

              if (status === 'ready') {
                // Phone bought AND agent built
                matchingIds = Object.entries(byLead)
                  .filter(([, log]) => {
                    const t = log.raw_webhook_data?.llm_ticks || {};
                    const a = { ...(t.agent1 || {}), ...(t.agent2 || {}), ...(t.agent3 || {}) };
                    const phone = a.phoneNumberPurchased || a.phonePurchased;
                    const build = a.agentBuildCompleted || a.agentBuildStarted;
                    return phone === 'verified' && build === 'verified';
                  })
                  .map(([id]) => id);
              } else if (status === 'phone_pending') {
                // Phone explicitly NOT yet purchased
                matchingIds = Object.entries(byLead)
                  .filter(([, log]) => {
                    const t = log.raw_webhook_data?.llm_ticks || {};
                    const a = { ...(t.agent1 || {}), ...(t.agent2 || {}), ...(t.agent3 || {}) };
                    const phone = a.phoneNumberPurchased || a.phonePurchased;
                    return phone === 'not_yet';
                  })
                  .map(([id]) => id);
              } else if (status === 'build_not_started') {
                // Agent build not yet done (not_yet or not_asked but had real call > 30s)
                matchingIds = Object.entries(byLead)
                  .filter(([, log]) => {
                    const t = log.raw_webhook_data?.llm_ticks || {};
                    const a = { ...(t.agent1 || {}), ...(t.agent2 || {}), ...(t.agent3 || {}) };
                    const build = a.agentBuildCompleted || a.agentBuildStarted;
                    const dur = log.duration || 0;
                    return dur > 30 && (build === 'not_yet' || build === 'not_asked');
                  })
                  .map(([id]) => id);
              } else if (status === 'not_interested_filter') {
                // Short calls (dropped) or explicit not_interested in final_status
                matchingIds = Object.entries(byLead)
                  .filter(([, log]) => (log.duration || 0) < 20)
                  .map(([id]) => id);
              }

              if (matchingIds.length > 0) {
                query = query.in('id', matchingIds);
              } else {
                // No matches — return empty
                res.json({ success: true, leads: [] });
                return;
              }
            } else {
              res.json({ success: true, leads: [] });
              return;
            }
          } else if (status === 'Not Interested') {
            query = query.eq('final_status', 'Not Interested');
          } else if (status !== 'all') {
            query = query.eq('final_status', status);
          }

          if (campaign !== 'all') {
            query = query.eq('campaign', campaign);
          }
          if (agent !== 'all') {
            query = query.eq('agent_id', agent);
          }

          if (sortBy === 'name') {
            query = query.order('name', { ascending: true });
          } else if (sortBy === 'final_status') {
            query = query.order('final_status', { ascending: true });
          } else {
            query = query.order('last_activity', { ascending: false });
          }

          const { data, error } = await query;
          if (error) throw error;
          res.json({ success: true, leads: data || [] });
          return;
        } catch (dbErr: any) {
          console.warn('[Supabase Leads Query Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const leads = inMemoryDB.getLeads({ search, status, campaign, agent, sortBy });
      res.json({ success: true, leads });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
          if (!error && data) {
            res.json({ success: true, lead: data });
            return;
          }
        } catch (dbErr: any) {
          console.warn('[Supabase LeadById Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const lead = inMemoryDB.getLeadById(id);
      if (!lead) {
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      res.json({ success: true, lead });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadCallLogs = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('call_logs')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            res.json({ success: true, calls: data });
            return;
          }
        } catch (dbErr: any) {
          console.warn('[Supabase LeadCallLogs Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const calls = inMemoryDB.getCallLogsByLeadId(id);
      res.json({ success: true, calls });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadActivities = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            res.json({ success: true, activities: data });
            return;
          }
        } catch (dbErr: any) {
          console.warn('[Supabase LeadActivities Error] Falling back to inMemoryDB:', dbErr.message);
        }
      }

      const activities = inMemoryDB.getActivitiesByLeadId(id);
      res.json({ success: true, activities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public resetSeed = async (req: Request, res: Response): Promise<void> => {
    try {
      inMemoryDB.seedReset();
      res.json({ success: true, message: 'Database reset to default seed data' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export const leadController = new LeadController();
