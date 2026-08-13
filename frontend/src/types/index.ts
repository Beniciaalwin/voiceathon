export type ActivityStatus = 'completed' | 'pending' | 'not_started' | 'failed';

export type FinalStatus =
  | 'Not Started'
  | 'Calling'
  | 'Follow-up Pending'
  | 'Follow-up Scheduled'
  | 'Reminder Pending'
  | 'Participated'
  | 'Completed'
  | 'Call Failed'
  | 'Invalid Number'
  | 'Not Interested'
  | 'No Answer'
  | 'Not Completed';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  agent_id: string;
  campaign?: string;

  agent_status: ActivityStatus;
  cold_call_status: ActivityStatus;
  followup_status: ActivityStatus;
  reminder_status: ActivityStatus;
  number_status: ActivityStatus;
  participated_status: ActivityStatus;
  email_status: ActivityStatus;

  final_status: FinalStatus;
  last_call_id?: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  call_id: string;
  agent_id: string;
  call_type: string;
  call_status: string;
  outcome?: string;
  duration: number;
  transcript?: string;
  summary?: string;
  callback_required: boolean;
  callback_time?: string;
  raw_webhook_data?: any;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  call_id?: string;
  activity_type: string;
  status: ActivityStatus;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  event_type: string;
  call_id?: string;
  phone?: string;
  status: 'Processed' | 'Failed' | 'Received';
  error_message?: string;
  raw_payload: any;
  received_at: string;
}

export interface DashboardStats {
  totalLeads: number;
  callsCompleted: number;
  followupsPending: number;
  completed: number;
  failedCalls: number;
}
