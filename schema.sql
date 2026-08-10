-- SnapServe AI Call Activity Dashboard Schema
-- Supabase PostgreSQL Tables & Indexes

-- 1. Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    agent_id VARCHAR(100) DEFAULT 'agent_snapserve_01',
    campaign VARCHAR(100) DEFAULT 'Outbound Sales Q3',

    -- Activity Statuses (completed, pending, not_started, failed)
    agent_status VARCHAR(50) DEFAULT 'completed',
    cold_call_status VARCHAR(50) DEFAULT 'not_started',
    followup_status VARCHAR(50) DEFAULT 'not_started',
    reminder_status VARCHAR(50) DEFAULT 'not_started',
    number_status VARCHAR(50) DEFAULT 'completed',
    participated_status VARCHAR(50) DEFAULT 'not_started',
    email_status VARCHAR(50) DEFAULT 'not_started',

    -- Calculated Final Status
    final_status VARCHAR(100) DEFAULT 'Not Started',

    last_call_id VARCHAR(100),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create call_logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    call_id VARCHAR(100) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,

    call_type VARCHAR(50) DEFAULT 'outbound_ai_call',
    call_status VARCHAR(50) NOT NULL, -- completed, failed, busy, no_answer, in_progress
    outcome VARCHAR(100), -- interested, callback_requested, busy, wrong_number, completed

    duration INT DEFAULT 0, -- in seconds
    transcript TEXT,
    summary TEXT,

    callback_required BOOLEAN DEFAULT FALSE,
    callback_time TIMESTAMPTZ,

    raw_webhook_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create activities table (Timeline)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    call_id VARCHAR(100),

    activity_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create webhook_logs table (Admin/Dev Debugging)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    call_id VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL, -- Processed, Failed, Received
    error_message TEXT,
    raw_payload JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index creation for optimal query performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_final_status ON public.leads(final_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON public.webhook_logs(received_at DESC);

-- Enable Supabase Realtime on these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;
