-- Enable realtime for recurring tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_routines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_tasks;