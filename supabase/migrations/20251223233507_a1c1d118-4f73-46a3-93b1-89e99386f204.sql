-- Enable realtime for lead_activities and scheduled_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_tasks;