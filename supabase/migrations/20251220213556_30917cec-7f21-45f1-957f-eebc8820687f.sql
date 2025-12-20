-- ================================================
-- ETAPA 3: SEGURANÇA, AUDITORIA E LGPD
-- ================================================

-- Habilitar extensão pgcrypto para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================
-- 1. TABELA DE LOGS DE AUDITORIA (já existe, melhorar)
-- ================================================
-- A tabela audit_log já existe, vamos verificar se precisa de ajustes

-- ================================================
-- 2. TABELA DE CONSENTIMENTOS DE USUÁRIO
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  policy_type TEXT NOT NULL DEFAULT 'privacy_policy',
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_policy_version ON public.user_consents(policy_version);

-- ================================================
-- 3. TABELA DE ALERTAS DE SEGURANÇA
-- ================================================
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_agency ON public.security_alerts(agency_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_event_type ON public.security_alerts(event_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_detected_at ON public.security_alerts(detected_at DESC);

-- ================================================
-- 4. TABELA DE EVENTOS DE LOGIN
-- ================================================
CREATE TABLE IF NOT EXISTS public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_ip ON public.login_events(ip_address);

-- ================================================
-- 5. TABELA DE SOLICITAÇÕES DE EXCLUSÃO (LGPD)
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  deletion_type TEXT NOT NULL DEFAULT 'full',
  notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.user_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.user_deletion_requests(user_id);

-- ================================================
-- 6. TABELA DE DADOS SENSÍVEIS CRIPTOGRAFADOS
-- ================================================
CREATE TABLE IF NOT EXISTS public.agency_sensitive_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  cnpj_encrypted BYTEA,
  bank_account_encrypted BYTEA,
  bank_agency_encrypted BYTEA,
  pix_key_encrypted BYTEA,
  encryption_key_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_agency_sensitive UNIQUE (agency_id)
);

-- ================================================
-- RLS POLICIES
-- ================================================

-- user_consents: usuário vê apenas seus próprios
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- security_alerts: super admin vê tudo, admin da agência vê os seus
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view all alerts"
  ON public.security_alerts FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency admin can view own alerts"
  ON public.security_alerts FOR SELECT
  USING (
    agency_id = public.current_agency_id()
    AND public.can_access_admin(auth.uid())
  );

CREATE POLICY "System can insert alerts"
  ON public.security_alerts FOR INSERT
  WITH CHECK (true);

-- login_events: usuário vê apenas seus próprios, super admin vê tudo
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert login events"
  ON public.login_events FOR INSERT
  WITH CHECK (true);

-- user_deletion_requests: super admin vê tudo
ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage deletion requests"
  ON public.user_deletion_requests FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can request own deletion"
  ON public.user_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- agency_sensitive_data: apenas admin da agência
ALTER TABLE public.agency_sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency admin can manage sensitive data"
  ON public.agency_sensitive_data FOR ALL
  USING (
    agency_id = public.current_agency_id()
    AND public.can_access_admin(auth.uid())
  );

-- ================================================
-- FUNÇÕES DE SEGURANÇA
-- ================================================

-- Função padronizada para log de ações
CREATE OR REPLACE FUNCTION public.log_action(
  _action_type TEXT,
  _entity_type TEXT,
  _entity_id TEXT DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _old_value JSONB DEFAULT NULL,
  _new_value JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_name TEXT;
  v_agency_id UUID;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Buscar agency_id atual
  v_agency_id := public.current_agency_id();

  -- Inserir log
  INSERT INTO public.audit_log (
    user_id,
    user_name,
    agency_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    old_value,
    new_value,
    metadata
  )
  VALUES (
    auth.uid(),
    COALESCE(v_user_name, 'Sistema'),
    v_agency_id,
    _action_type,
    _entity_type,
    _entity_id,
    _entity_name,
    _old_value,
    _new_value,
    _metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Função para solicitar exclusão de dados (LGPD)
CREATE OR REPLACE FUNCTION public.request_user_deletion(
  _user_id UUID,
  _deletion_type TEXT DEFAULT 'full',
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_user_email TEXT;
  v_agency_id UUID;
BEGIN
  -- Verificar se é o próprio usuário ou super admin
  IF auth.uid() != _user_id AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only the user or super admin can request deletion';
  END IF;

  -- Buscar email do usuário
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = _user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Buscar agency
  SELECT current_agency_id INTO v_agency_id
  FROM public.profiles
  WHERE id = _user_id;

  -- Criar solicitação
  INSERT INTO public.user_deletion_requests (
    user_id,
    user_email,
    agency_id,
    deletion_type,
    notes,
    metadata
  )
  VALUES (
    _user_id,
    v_user_email,
    v_agency_id,
    _deletion_type,
    _notes,
    jsonb_build_object(
      'requested_by', auth.uid(),
      'ip', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  )
  RETURNING id INTO v_request_id;

  -- Marcar usuário como pendente de exclusão
  UPDATE public.profiles
  SET status = 'excluido', updated_at = now()
  WHERE id = _user_id;

  -- Criar alerta de segurança
  INSERT INTO public.security_alerts (
    user_id,
    agency_id,
    event_type,
    severity,
    details
  )
  VALUES (
    _user_id,
    v_agency_id,
    'deletion_request',
    'high',
    jsonb_build_object(
      'request_id', v_request_id,
      'deletion_type', _deletion_type
    )
  );

  -- Log da ação
  PERFORM public.log_action(
    'deletion_request',
    'user',
    _user_id::TEXT,
    v_user_email,
    NULL,
    jsonb_build_object('status', 'pending', 'type', _deletion_type),
    NULL
  );

  RETURN v_request_id;
END;
$$;

-- Função para detectar logins suspeitos
CREATE OR REPLACE FUNCTION public.detect_suspicious_logins(_user_id UUID, _window_minutes INT DEFAULT 30)
RETURNS TABLE(
  is_suspicious BOOLEAN,
  reason TEXT,
  recent_ips TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_distinct_ips INT;
  v_ips TEXT[];
  v_failed_attempts INT;
BEGIN
  -- Contar IPs distintos nos últimos N minutos
  SELECT 
    COUNT(DISTINCT ip_address),
    ARRAY_AGG(DISTINCT ip_address::TEXT)
  INTO v_distinct_ips, v_ips
  FROM public.login_events
  WHERE user_id = _user_id
    AND created_at > now() - (_window_minutes || ' minutes')::INTERVAL
    AND success = true;

  -- Contar tentativas falhas
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM public.login_events
  WHERE user_id = _user_id
    AND created_at > now() - (_window_minutes || ' minutes')::INTERVAL
    AND success = false;

  -- Verificar condições suspeitas
  IF v_distinct_ips >= 3 THEN
    RETURN QUERY SELECT true, 'Múltiplos IPs em curto período', v_ips;
  ELSIF v_failed_attempts >= 5 THEN
    RETURN QUERY SELECT true, 'Múltiplas tentativas falhas', v_ips;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, v_ips;
  END IF;
END;
$$;

-- Função para registrar alerta de abuso de limite
CREATE OR REPLACE FUNCTION public.log_limit_abuse(
  _agency_id UUID,
  _user_id UUID,
  _resource TEXT,
  _attempted_count INT,
  _limit INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    agency_id,
    user_id,
    event_type,
    severity,
    details
  )
  VALUES (
    _agency_id,
    _user_id,
    'limit_abuse_attempt',
    'medium',
    jsonb_build_object(
      'resource', _resource,
      'attempted', _attempted_count,
      'limit', _limit,
      'exceeded_by', _attempted_count - _limit
    )
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

-- Função para registrar login
CREATE OR REPLACE FUNCTION public.log_login_event(
  _success BOOLEAN,
  _failure_reason TEXT DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_ip INET;
BEGIN
  -- Converter IP para INET
  BEGIN
    v_ip := _ip_address::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  INSERT INTO public.login_events (
    user_id,
    ip_address,
    user_agent,
    success,
    failure_reason
  )
  VALUES (
    auth.uid(),
    v_ip,
    _user_agent,
    _success,
    _failure_reason
  )
  RETURNING id INTO v_event_id;

  -- Verificar se é suspeito
  IF _success THEN
    DECLARE
      v_suspicious RECORD;
    BEGIN
      SELECT * INTO v_suspicious
      FROM public.detect_suspicious_logins(auth.uid(), 30);

      IF v_suspicious.is_suspicious THEN
        INSERT INTO public.security_alerts (
          user_id,
          event_type,
          severity,
          details
        )
        VALUES (
          auth.uid(),
          'suspicious_login',
          'high',
          jsonb_build_object(
            'reason', v_suspicious.reason,
            'recent_ips', v_suspicious.recent_ips,
            'login_event_id', v_event_id
          )
        );
      END IF;
    END;
  END IF;

  RETURN v_event_id;
END;
$$;

-- Função para criptografar CNPJ
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  _data TEXT,
  _key TEXT DEFAULT 'rankeia_secret_key_v1'
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_encrypt(_data, _key);
END;
$$;

-- Função para descriptografar dados
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(
  _encrypted BYTEA,
  _key TEXT DEFAULT 'rankeia_secret_key_v1'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(_encrypted, _key);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Função para verificar consentimento ativo
CREATE OR REPLACE FUNCTION public.has_active_consent(
  _user_id UUID,
  _policy_type TEXT DEFAULT 'privacy_policy',
  _min_version TEXT DEFAULT '1.0'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_consents
    WHERE user_id = _user_id
      AND policy_type = _policy_type
      AND policy_version >= _min_version
      AND revoked_at IS NULL
    ORDER BY accepted_at DESC
    LIMIT 1
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agency_sensitive_data_updated_at
  BEFORE UPDATE ON public.agency_sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();