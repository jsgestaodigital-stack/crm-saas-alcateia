-- =============================================
-- SEGURANÇA AVANÇADA: RATE LIMITING
-- =============================================

-- Tabela para controle de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_id UUID,
  endpoint TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  blocked BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_events(ip_address, endpoint, attempted_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON public.rate_limit_events(user_id, attempted_at);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _ip_address INET,
  _endpoint TEXT,
  _max_requests INTEGER DEFAULT 100,
  _window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Conta requisições na janela de tempo
  SELECT COUNT(*) INTO request_count
  FROM public.rate_limit_events
  WHERE ip_address = _ip_address
    AND endpoint = _endpoint
    AND attempted_at > now() - (_window_seconds || ' seconds')::INTERVAL
    AND NOT blocked;
  
  -- Registra a tentativa
  INSERT INTO public.rate_limit_events (ip_address, endpoint, blocked)
  VALUES (_ip_address, _endpoint, request_count >= _max_requests);
  
  -- Retorna true se bloqueado
  RETURN request_count >= _max_requests;
END;
$$;

-- Limpar eventos antigos (manter apenas últimas 24h)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_events
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;

-- =============================================
-- SEGURANÇA AVANÇADA: IP WHITELIST SUPER ADMIN
-- =============================================

CREATE TABLE IF NOT EXISTS public.super_admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, ip_address)
);

-- Função para verificar IP do Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin_ip_allowed(
  _user_id UUID,
  _ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  whitelist_count INTEGER;
  is_whitelisted BOOLEAN;
BEGIN
  -- Verifica se há whitelist configurada para o usuário
  SELECT COUNT(*) INTO whitelist_count
  FROM public.super_admin_ip_whitelist
  WHERE user_id = _user_id AND is_active = true;
  
  -- Se não há whitelist, permite (backward compatible)
  IF whitelist_count = 0 THEN
    RETURN true;
  END IF;
  
  -- Verifica se IP está na whitelist
  SELECT EXISTS(
    SELECT 1 FROM public.super_admin_ip_whitelist
    WHERE user_id = _user_id
      AND ip_address = _ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_whitelisted;
  
  -- Log tentativa não autorizada
  IF NOT is_whitelisted THEN
    INSERT INTO public.mt_security_violations (
      violation_type, user_id, details, severity
    ) VALUES (
      'SUPER_ADMIN_IP_BLOCKED',
      _user_id,
      jsonb_build_object('blocked_ip', _ip_address::TEXT),
      'high'
    );
  END IF;
  
  RETURN is_whitelisted;
END;
$$;

-- =============================================
-- DETECÇÃO DE ANOMALIAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL,
  agency_id UUID REFERENCES public.agencies(id),
  user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT
);

-- Índices para anomalias
CREATE INDEX IF NOT EXISTS idx_anomaly_agency ON public.anomaly_detections(agency_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON public.anomaly_detections(severity, resolved_at);

-- Função para detectar anomalias de uso
CREATE OR REPLACE FUNCTION public.detect_usage_anomalies()
RETURNS TABLE(agency_id UUID, anomaly_type TEXT, details JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Agências com uso muito acima do limite
  RETURN QUERY
  SELECT 
    u.agency_id,
    'USAGE_OVER_LIMIT'::TEXT as anomaly_type,
    jsonb_build_object(
      'current_leads', u.current_leads,
      'max_leads', l.max_leads,
      'current_clients', u.current_clients,
      'max_clients', l.max_clients,
      'overage_percent', ROUND(((u.current_leads::NUMERIC / NULLIF(l.max_leads, 0)) * 100) - 100, 2)
    ) as details
  FROM public.agency_usage u
  JOIN public.agency_limits l ON u.agency_id = l.agency_id
  WHERE u.current_leads > l.max_leads * 1.1  -- 10% acima do limite
     OR u.current_clients > l.max_clients * 1.1;
  
  -- 2. Agências com atividade suspeita (muitos logins falhos)
  RETURN QUERY
  SELECT 
    am.agency_id,
    'SUSPICIOUS_LOGIN_ACTIVITY'::TEXT as anomaly_type,
    jsonb_build_object(
      'failed_attempts_24h', COUNT(*),
      'unique_ips', COUNT(DISTINCT ip_address)
    ) as details
  FROM public.failed_login_attempts f
  JOIN public.profiles p ON f.email = p.email
  JOIN public.agency_members am ON p.id = am.user_id
  WHERE f.attempted_at > now() - INTERVAL '24 hours'
  GROUP BY am.agency_id
  HAVING COUNT(*) > 10;
  
  -- 3. Crescimento anormal de dados (mais de 50% em 24h)
  RETURN QUERY
  WITH daily_growth AS (
    SELECT 
      agency_id,
      current_leads,
      LAG(current_leads) OVER (PARTITION BY agency_id ORDER BY last_calculated_at) as prev_leads
    FROM public.agency_usage
  )
  SELECT 
    dg.agency_id,
    'ABNORMAL_GROWTH'::TEXT as anomaly_type,
    jsonb_build_object(
      'current_leads', dg.current_leads,
      'previous_leads', dg.prev_leads,
      'growth_percent', ROUND(((dg.current_leads::NUMERIC / NULLIF(dg.prev_leads, 0)) - 1) * 100, 2)
    ) as details
  FROM daily_growth dg
  WHERE dg.prev_leads IS NOT NULL
    AND dg.current_leads > dg.prev_leads * 1.5;
END;
$$;

-- Função para executar detecção e registrar anomalias
CREATE OR REPLACE FUNCTION public.run_anomaly_detection()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anomaly RECORD;
  count_inserted INTEGER := 0;
BEGIN
  FOR anomaly IN SELECT * FROM public.detect_usage_anomalies() LOOP
    -- Verifica se já existe anomalia não resolvida do mesmo tipo
    IF NOT EXISTS (
      SELECT 1 FROM public.anomaly_detections
      WHERE agency_id = anomaly.agency_id
        AND anomaly_type = anomaly.anomaly_type
        AND resolved_at IS NULL
    ) THEN
      INSERT INTO public.anomaly_detections (agency_id, anomaly_type, details, severity)
      VALUES (
        anomaly.agency_id,
        anomaly.anomaly_type,
        anomaly.details,
        CASE 
          WHEN anomaly.anomaly_type = 'SUSPICIOUS_LOGIN_ACTIVITY' THEN 'high'
          WHEN anomaly.anomaly_type = 'USAGE_OVER_LIMIT' THEN 'medium'
          ELSE 'low'
        END
      );
      count_inserted := count_inserted + 1;
      
      -- Cria alerta para Super Admin
      INSERT INTO public.super_admin_alerts (
        alert_type, severity, title, message, metadata
      ) VALUES (
        'ANOMALY_DETECTED',
        CASE 
          WHEN anomaly.anomaly_type = 'SUSPICIOUS_LOGIN_ACTIVITY' THEN 'high'
          ELSE 'medium'
        END,
        'Anomalia detectada: ' || anomaly.anomaly_type,
        'Agência ' || anomaly.agency_id::TEXT || ' apresenta comportamento anômalo',
        anomaly.details
      );
    END IF;
  END LOOP;
  
  RETURN count_inserted;
END;
$$;

-- =============================================
-- MONITORAMENTO DE SESSÕES ATIVAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agency_id UUID REFERENCES public.agencies(id),
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours',
  is_active BOOLEAN DEFAULT true
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.active_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_agency ON public.active_sessions(agency_id, is_active);

-- Função para invalidar sessões antigas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_cleaned INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.active_sessions
    WHERE expires_at < now() OR (last_activity_at < now() - INTERVAL '2 hours' AND is_active = false)
    RETURNING *
  )
  SELECT COUNT(*) INTO count_cleaned FROM deleted;
  
  RETURN count_cleaned;
END;
$$;

-- Função para forçar logout de usuário
CREATE OR REPLACE FUNCTION public.force_user_logout(_user_id UUID, _reason TEXT DEFAULT 'security')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_invalidated INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.active_sessions
    SET is_active = false, expires_at = now()
    WHERE user_id = _user_id AND is_active = true
    RETURNING *
  )
  SELECT COUNT(*) INTO count_invalidated FROM updated;
  
  -- Registra violação de segurança
  INSERT INTO public.mt_security_violations (
    violation_type, user_id, details, severity
  ) VALUES (
    'FORCED_LOGOUT',
    _user_id,
    jsonb_build_object('reason', _reason, 'sessions_invalidated', count_invalidated),
    'medium'
  );
  
  RETURN count_invalidated;
END;
$$;

-- =============================================
-- RLS PARA NOVAS TABELAS
-- =============================================

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Rate limit events - apenas super admin
CREATE POLICY "rate_limit_super_admin" ON public.rate_limit_events
FOR ALL USING (is_super_admin(auth.uid()));

-- IP Whitelist - super admin pode gerenciar
CREATE POLICY "ip_whitelist_super_admin" ON public.super_admin_ip_whitelist
FOR ALL USING (is_super_admin(auth.uid()));

-- Anomalias - super admin vê todas, admins veem da sua agência
CREATE POLICY "anomalies_select" ON public.anomaly_detections
FOR SELECT USING (
  is_super_admin(auth.uid()) OR agency_id = current_agency_id()
);

CREATE POLICY "anomalies_update" ON public.anomaly_detections
FOR UPDATE USING (
  is_super_admin(auth.uid()) OR (agency_id = current_agency_id() AND is_admin(auth.uid()))
);

-- Sessões ativas - usuário vê suas próprias, admin vê da agência
CREATE POLICY "sessions_select" ON public.active_sessions
FOR SELECT USING (
  user_id = auth.uid() OR 
  (agency_id = current_agency_id() AND is_admin(auth.uid())) OR
  is_super_admin(auth.uid())
);

CREATE POLICY "sessions_manage" ON public.active_sessions
FOR ALL USING (
  is_super_admin(auth.uid()) OR 
  (agency_id = current_agency_id() AND is_admin(auth.uid()))
);