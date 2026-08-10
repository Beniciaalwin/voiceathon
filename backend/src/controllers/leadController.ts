import { Request, Response } from 'express';
import { isSupabaseConfigured, supabase, inMemoryDB } from '../config/db';

export class LeadController {
  public getLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';
      const campaign = (req.query.campaign as string) || 'all';
      const agent = (req.query.agent as string) || 'all';
      const sortBy = (req.query.sortBy as string) || 'last_activity';

      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('leads').select('*');

        if (search) {
          query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (status !== 'all') {
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
        res.json({ success: true, leads: data });
      } else {
        const leads = inMemoryDB.getLeads({ search, status, campaign, agent, sortBy });
        res.json({ success: true, leads });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
        if (error || !data) {
          res.status(404).json({ success: false, error: 'Lead not found' });
          return;
        }
        res.json({ success: true, lead: data });
      } else {
        const lead = inMemoryDB.getLeadById(id);
        if (!lead) {
          res.status(404).json({ success: false, error: 'Lead not found' });
          return;
        }
        res.json({ success: true, lead });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadCallLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, calls: data });
      } else {
        const calls = inMemoryDB.getCallLogsByLeadId(id);
        res.json({ success: true, calls });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getLeadActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, activities: data });
      } else {
        const activities = inMemoryDB.getActivitiesByLeadId(id);
        res.json({ success: true, activities });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public resetSeed = async (req: Request, res: Response): Promise<void> => {
    try {
      inMemoryDB.seedReset();
      res.json({ success: true, message: 'Sample dataset reset successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

export const leadController = new LeadController();
