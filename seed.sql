-- Seed initial leads and data for SnapServe AI Call Activity Dashboard

INSERT INTO public.leads (id, name, phone, email, agent_id, campaign, agent_status, cold_call_status, followup_status, reminder_status, number_status, participated_status, email_status, final_status, last_activity)
VALUES
('00000000-0000-0000-0000-000000000001', 'Arun Kumar', '+919876543210', 'arun.k@gmail.com', 'agent_snapserve_01', 'Enterprise Sales', 'completed', 'completed', 'pending', 'not_started', 'completed', 'not_started', 'completed', 'Follow-up Pending', NOW() - INTERVAL '5 minutes'),
('00000000-0000-0000-0000-000000000002', 'Priya Sharma', '+919712345678', 'priya.s@gmail.com', 'agent_snapserve_01', 'Enterprise Sales', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'Completed', NOW() - INTERVAL '15 minutes'),
('00000000-0000-0000-0000-000000000003', 'Karthik Raja', '+919698765432', 'karthik.r@gmail.com', 'agent_snapserve_02', 'Outbound Sales Q3', 'not_started', 'not_started', 'not_started', 'not_started', 'failed', 'not_started', 'not_started', 'Not Started', NOW() - INTERVAL '2 hours');

-- Seed Call Logs
INSERT INTO public.call_logs (lead_id, call_id, agent_id, call_type, call_status, outcome, duration, transcript, summary, callback_required, callback_time)
VALUES
('00000000-0000-0000-0000-000000000001', 'call_arun_101', 'agent_snapserve_01', 'outbound_ai_call', 'completed', 'callback_requested', 154,
'AI: Hello Arun, calling from SnapServe regarding your Voice AI inquiry.\nArun: Hi yes, I want to learn more about the pricing and integration.\nAI: Great! I can schedule a technical demo for tomorrow.\nArun: Sure, please call me back tomorrow at 3 PM.',
'Lead expressed strong interest in SnapServe pricing and CRM integration. Requested a scheduled callback tomorrow at 3:00 PM.',
TRUE, NOW() + INTERVAL '1 day'),

('00000000-0000-0000-0000-000000000002', 'call_priya_102', 'agent_snapserve_01', 'outbound_ai_call', 'completed', 'completed', 210,
'AI: Hi Priya, following up on your demo request.\nPriya: Thanks! The demo was super clear. We are ready to sign up.\nAI: Wonderful! Sending over the onboarding email right away.',
'Lead confirmed plan selection after AI call consultation. Onboarding email sent and verified.',
FALSE, NULL);

-- Seed Activities Timeline
INSERT INTO public.activities (lead_id, call_id, activity_type, status, description)
VALUES
('00000000-0000-0000-0000-000000000001', 'call_arun_101', 'ai_call_completed', 'completed', 'AI Call completed (Duration: 2m 34s)'),
('00000000-0000-0000-0000-000000000001', 'call_arun_101', 'followup_requested', 'pending', 'Follow-up requested by lead for pricing & integration'),
('00000000-0000-0000-0000-000000000001', NULL, 'email_sent', 'completed', 'Confirmation email sent to arun.k@gmail.com'),

('00000000-0000-0000-0000-000000000002', 'call_priya_102', 'ai_call_completed', 'completed', 'AI Call completed (Duration: 3m 30s)'),
('00000000-0000-0000-0000-000000000002', 'call_priya_102', 'followup_completed', 'completed', 'Follow-up discussion completed successfully'),
('00000000-0000-0000-0000-000000000002', NULL, 'reminder_sent', 'completed', 'Onboarding calendar invitation sent'),

('00000000-0000-0000-0000-000000000003', NULL, 'lead_created', 'not_started', 'Lead added to campaign - awaiting initial AI call');
