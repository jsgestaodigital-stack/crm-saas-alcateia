-- Create a table to store engagement metrics/events for scoring
CREATE TABLE public.user_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.user_engagement_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policy: Super admins can read all events
CREATE POLICY "Super admins can read all events" ON public.user_engagement_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_user_engagement_user_id ON public.user_engagement_events(user_id);
CREATE INDEX idx_user_engagement_agency_id ON public.user_engagement_events(agency_id);
CREATE INDEX idx_user_engagement_created_at ON public.user_engagement_events(created_at);

-- Create a view for aggregated engagement scores
CREATE OR REPLACE VIEW public.user_engagement_scores AS
SELECT 
  ue.user_id,
  ue.agency_id,
  COUNT(DISTINCT ue.id) as total_events,
  SUM(ue.weight) as total_score,
  COUNT(DISTINCT DATE(ue.created_at)) as active_days,
  COUNT(CASE WHEN ue.event_category = 'navigation' THEN 1 END) as navigation_events,
  COUNT(CASE WHEN ue.event_category = 'crud' THEN 1 END) as crud_events,
  COUNT(CASE WHEN ue.event_category = 'feature' THEN 1 END) as feature_events,
  MAX(ue.created_at) as last_activity,
  MIN(ue.created_at) as first_activity,
  a.name as agency_name,
  p.full_name as user_name
FROM public.user_engagement_events ue
JOIN public.agencies a ON a.id = ue.agency_id
LEFT JOIN public.profiles p ON p.id = ue.user_id
GROUP BY ue.user_id, ue.agency_id, a.name, p.full_name;

-- Create function to log engagement events
CREATE OR REPLACE FUNCTION public.log_engagement_event(
  _event_type TEXT,
  _event_category TEXT,
  _weight INTEGER DEFAULT 1,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _agency_id UUID;
  _event_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get user's agency
  SELECT agency_id INTO _agency_id
  FROM agency_members
  WHERE user_id = _user_id
  LIMIT 1;

  IF _agency_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO user_engagement_events (user_id, agency_id, event_type, event_category, weight, metadata)
  VALUES (_user_id, _agency_id, _event_type, _event_category, _weight, _metadata)
  RETURNING id INTO _event_id;

  RETURN _event_id;
END;
$$;

-- Create function for super admin to get engagement rankings
CREATE OR REPLACE FUNCTION public.get_engagement_rankings(
  _days_back INTEGER DEFAULT 30,
  _limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  agency_id UUID,
  user_name TEXT,
  agency_name TEXT,
  total_score BIGINT,
  total_events BIGINT,
  active_days BIGINT,
  navigation_score BIGINT,
  crud_score BIGINT,
  feature_score BIGINT,
  avg_daily_score NUMERIC,
  last_activity TIMESTAMP WITH TIME ZONE,
  days_since_last_activity INTEGER,
  engagement_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_permissions WHERE user_permissions.user_id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    ue.user_id,
    ue.agency_id,
    COALESCE(p.full_name, 'Sem nome')::TEXT as user_name,
    a.name::TEXT as agency_name,
    SUM(ue.weight)::BIGINT as total_score,
    COUNT(DISTINCT ue.id)::BIGINT as total_events,
    COUNT(DISTINCT DATE(ue.created_at))::BIGINT as active_days,
    SUM(CASE WHEN ue.event_category = 'navigation' THEN ue.weight ELSE 0 END)::BIGINT as navigation_score,
    SUM(CASE WHEN ue.event_category = 'crud' THEN ue.weight ELSE 0 END)::BIGINT as crud_score,
    SUM(CASE WHEN ue.event_category = 'feature' THEN ue.weight ELSE 0 END)::BIGINT as feature_score,
    ROUND(SUM(ue.weight)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(ue.created_at)), 0), 2) as avg_daily_score,
    MAX(ue.created_at) as last_activity,
    EXTRACT(DAY FROM (NOW() - MAX(ue.created_at)))::INTEGER as days_since_last_activity,
    CASE 
      WHEN SUM(ue.weight) >= 500 AND COUNT(DISTINCT DATE(ue.created_at)) >= 10 THEN 'champion'
      WHEN SUM(ue.weight) >= 200 AND COUNT(DISTINCT DATE(ue.created_at)) >= 5 THEN 'power_user'
      WHEN SUM(ue.weight) >= 50 AND COUNT(DISTINCT DATE(ue.created_at)) >= 2 THEN 'active'
      WHEN SUM(ue.weight) >= 10 THEN 'exploring'
      ELSE 'inactive'
    END::TEXT as engagement_level
  FROM user_engagement_events ue
  JOIN agencies a ON a.id = ue.agency_id
  LEFT JOIN profiles p ON p.id = ue.user_id
  WHERE ue.created_at >= NOW() - (_days_back || ' days')::INTERVAL
  GROUP BY ue.user_id, ue.agency_id, p.full_name, a.name
  ORDER BY SUM(ue.weight) DESC
  LIMIT _limit;
END;
$$;