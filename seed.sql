-- Clear dummy sample data (Ready for live SnapServe Webhook ingestion)
TRUNCATE TABLE public.activities, public.call_logs, public.webhook_logs, public.leads CASCADE;
