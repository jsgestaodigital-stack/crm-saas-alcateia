-- =====================================================
-- BLOCO 18: SEGURANÇA E PROTEÇÃO DE SESSÕES
-- =====================================================

-- 1. Adicionar coluna blocked ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- 2. Tabela para rastrear tentativas de login falhadas (brute-force protection)
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para consulta rápida por email e IP
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON public.failed_login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON public.failed_login_attempts(ip_address, attempted_at);

-- 3. Tabela para armazenar sessões ativas (para logout em massa)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, is_active);

-- 4. Tabela para log de ações críticas (auditoria de segurança)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- password_change, email_change, role_change, plan_change, login, logout, blocked, unblocked
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- quem executou (pode ser admin)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action_type, created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para failed_login_attempts (apenas system pode inserir)
CREATE POLICY "System can insert failed attempts" ON public.failed_login_attempts
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view failed attempts" ON public.failed_login_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  )
);

-- 7. Políticas RLS para user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON public.user_sessions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert sessions" ON public.user_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  )
);

-- 8. Políticas RLS para security_audit_log
CREATE POLICY "Users can view own audit log" ON public.security_audit_log
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.security_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  )
);

CREATE POLICY "System can insert audit log" ON public.security_audit_log
FOR INSERT WITH CHECK (true);

-- 9. Função para verificar rate limit de login
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  _email TEXT,
  _ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_attempts INT;
  ip_attempts INT;
  max_attempts INT := 5;
  lockout_minutes INT := 15;
  is_blocked BOOLEAN := false;
  remaining_lockout INT := 0;
BEGIN
  -- Contar tentativas por email nos últimos X minutos
  SELECT COUNT(*) INTO email_attempts
  FROM public.failed_login_attempts
  WHERE email = _email
    AND attempted_at > (now() - (lockout_minutes || ' minutes')::interval);

  -- Contar tentativas por IP nos últimos X minutos
  IF _ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_attempts
    FROM public.failed_login_attempts
    WHERE ip_address = _ip_address
      AND attempted_at > (now() - (lockout_minutes || ' minutes')::interval);
  ELSE
    ip_attempts := 0;
  END IF;

  -- Verificar se está bloqueado
  IF email_attempts >= max_attempts OR ip_attempts >= max_attempts * 2 THEN
    is_blocked := true;
    
    -- Calcular tempo restante de bloqueio
    SELECT EXTRACT(EPOCH FROM (
      (MAX(attempted_at) + (lockout_minutes || ' minutes')::interval) - now()
    ))::int INTO remaining_lockout
    FROM public.failed_login_attempts
    WHERE email = _email OR ip_address = _ip_address;
  END IF;

  RETURN jsonb_build_object(
    'is_blocked', is_blocked,
    'email_attempts', email_attempts,
    'ip_attempts', ip_attempts,
    'max_attempts', max_attempts,
    'remaining_lockout_seconds', GREATEST(0, remaining_lockout),
    'lockout_minutes', lockout_minutes
  );
END;
$$;

-- 10. Função para registrar tentativa de login falhada
CREATE OR REPLACE FUNCTION public.record_failed_login(
  _email TEXT,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.failed_login_attempts (email, ip_address, user_agent, attempted_at)
  VALUES (_email, _ip_address, _user_agent, now());
END;
$$;

-- 11. Função para limpar tentativas antigas (pode ser chamada por cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < (now() - interval '24 hours');
END;
$$;

-- 12. Função para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT blocked, blocked_at, blocked_reason 
  INTO profile_record
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('blocked', false);
  END IF;

  RETURN jsonb_build_object(
    'blocked', COALESCE(profile_record.blocked, false),
    'blocked_at', profile_record.blocked_at,
    'blocked_reason', profile_record.blocked_reason
  );
END;
$$;

-- 13. Função para bloquear usuário
CREATE OR REPLACE FUNCTION public.block_user(
  _user_id UUID,
  _reason TEXT DEFAULT 'Bloqueado pelo administrador'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se quem está executando é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem bloquear usuários';
  END IF;

  UPDATE public.profiles
  SET 
    blocked = true,
    blocked_at = now(),
    blocked_reason = _reason
  WHERE id = _user_id;

  -- Registrar na auditoria
  INSERT INTO public.security_audit_log (user_id, action_type, action_details, performed_by)
  VALUES (
    _user_id, 
    'user_blocked', 
    jsonb_build_object('reason', _reason),
    auth.uid()
  );

  -- Invalidar todas as sessões do usuário
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = _user_id;
END;
$$;

-- 14. Função para desbloquear usuário
CREATE OR REPLACE FUNCTION public.unblock_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se quem está executando é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem desbloquear usuários';
  END IF;

  UPDATE public.profiles
  SET 
    blocked = false,
    blocked_at = NULL,
    blocked_reason = NULL
  WHERE id = _user_id;

  -- Registrar na auditoria
  INSERT INTO public.security_audit_log (user_id, action_type, action_details, performed_by)
  VALUES (_user_id, 'user_unblocked', '{}'::jsonb, auth.uid());
END;
$$;

-- 15. Função para invalidar todas as sessões de um usuário
CREATE OR REPLACE FUNCTION public.invalidate_all_sessions(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usuário pode invalidar próprias sessões, ou admin pode invalidar de qualquer um
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para invalidar sessões deste usuário';
  END IF;

  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = _user_id;

  -- Registrar na auditoria
  INSERT INTO public.security_audit_log (user_id, action_type, action_details, performed_by)
  VALUES (_user_id, 'sessions_invalidated', '{}'::jsonb, auth.uid());
END;
$$;

-- 16. Função para registrar login bem sucedido com mais detalhes
CREATE OR REPLACE FUNCTION public.log_successful_login(
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _location TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar no login_events
  INSERT INTO public.login_events (user_id, ip_address, user_agent, location, success)
  VALUES (auth.uid(), _ip_address, _user_agent, _location, true);

  -- Criar sessão ativa
  INSERT INTO public.user_sessions (user_id, session_token, ip_address, user_agent, device_info)
  VALUES (
    auth.uid(), 
    gen_random_uuid()::text, 
    _ip_address, 
    _user_agent,
    _user_agent
  );

  -- Registrar na auditoria de segurança
  INSERT INTO public.security_audit_log (user_id, action_type, action_details, ip_address, user_agent, location)
  VALUES (
    auth.uid(), 
    'login', 
    jsonb_build_object('method', 'password'),
    _ip_address,
    _user_agent,
    _location
  );

  -- Atualizar último login no profile
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = auth.uid();

  -- Limpar tentativas de login falhadas para este usuário
  -- (Buscar email do usuário primeiro)
  DELETE FROM public.failed_login_attempts
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$;

-- 17. Função para registrar mudança de senha
CREATE OR REPLACE FUNCTION public.log_password_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar timestamp no profile
  UPDATE public.profiles
  SET password_changed_at = now()
  WHERE id = auth.uid();

  -- Registrar na auditoria
  INSERT INTO public.security_audit_log (user_id, action_type, action_details, performed_by)
  VALUES (auth.uid(), 'password_change', '{}'::jsonb, auth.uid());

  -- Invalidar todas as outras sessões (exceto a atual - mas como não temos como identificar, invalidamos todas)
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = auth.uid();
END;
$$;

-- 18. Função para obter histórico de logins
CREATE OR REPLACE FUNCTION public.get_login_history(_user_id UUID DEFAULT NULL, _limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN,
  failure_reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se não especificou user_id, usa o próprio usuário
  IF _user_id IS NULL THEN
    _user_id := auth.uid();
  END IF;

  -- Verificar permissão
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para ver histórico de login deste usuário';
  END IF;

  RETURN QUERY
  SELECT 
    le.id,
    le.ip_address,
    le.user_agent,
    le.location,
    le.success,
    le.failure_reason,
    le.created_at
  FROM public.login_events le
  WHERE le.user_id = _user_id
  ORDER BY le.created_at DESC
  LIMIT _limit;
END;
$$;

-- 19. Função para obter sessões ativas
CREATE OR REPLACE FUNCTION public.get_active_sessions(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    _user_id := auth.uid();
  END IF;

  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND (is_super_admin = true OR can_admin = true)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para ver sessões deste usuário';
  END IF;

  RETURN QUERY
  SELECT 
    us.id,
    us.ip_address,
    us.user_agent,
    us.device_info,
    us.last_activity,
    us.created_at
  FROM public.user_sessions us
  WHERE us.user_id = _user_id AND us.is_active = true
  ORDER BY us.last_activity DESC;
END;
$$;