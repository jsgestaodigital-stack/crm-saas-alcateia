-- =============================================
-- TABELA: pending_registrations
-- Armazena solicitações de cadastro de novas agências
-- =============================================
CREATE TABLE public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  agency_slug TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_pending_registrations_status ON public.pending_registrations(status);
CREATE INDEX idx_pending_registrations_email ON public.pending_registrations(owner_email);

-- RLS: Apenas Super Admin pode ver/gerenciar registros pendentes
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Política para INSERT público (qualquer pessoa pode se cadastrar)
CREATE POLICY "Anyone can register"
ON public.pending_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- Política para SELECT (apenas super admin)
CREATE POLICY "Super admin can view registrations"
ON public.pending_registrations
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Política para UPDATE (apenas super admin)
CREATE POLICY "Super admin can update registrations"
ON public.pending_registrations
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Política para DELETE (apenas super admin)
CREATE POLICY "Super admin can delete registrations"
ON public.pending_registrations
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_pending_registrations_updated_at
BEFORE UPDATE ON public.pending_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- FUNÇÃO: approve_registration
-- Aprova um registro e cria a agência + usuário owner
-- =============================================
CREATE OR REPLACE FUNCTION public.approve_registration(_registration_id UUID, _temp_password TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reg RECORD;
  v_agency_id UUID;
  v_user_id UUID;
  v_password TEXT;
BEGIN
  -- Verificar se é super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can approve registrations';
  END IF;

  -- Buscar registro
  SELECT * INTO v_reg FROM pending_registrations WHERE id = _registration_id;
  
  IF v_reg IS NULL THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  
  IF v_reg.status != 'pending' THEN
    RAISE EXCEPTION 'Registration already processed';
  END IF;

  -- Gerar senha temporária se não fornecida
  v_password := COALESCE(_temp_password, 'Temp@' || substr(md5(random()::text), 1, 8));

  -- Criar agência
  INSERT INTO agencies (name, slug, status)
  VALUES (v_reg.agency_name, v_reg.agency_slug, 'active')
  RETURNING id INTO v_agency_id;

  -- Atualizar registro como aprovado
  UPDATE pending_registrations
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = _registration_id;

  -- Log da ação
  INSERT INTO super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (
    auth.uid(), 
    v_agency_id, 
    'approve_registration', 
    jsonb_build_object(
      'registration_id', _registration_id,
      'agency_name', v_reg.agency_name,
      'owner_email', v_reg.owner_email
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'agency_id', v_agency_id,
    'owner_email', v_reg.owner_email,
    'temp_password', v_password,
    'message', 'Agency approved. User needs to be created via edge function.'
  );
END;
$$;

-- =============================================
-- FUNÇÃO: reject_registration
-- Rejeita um registro com motivo
-- =============================================
CREATE OR REPLACE FUNCTION public.reject_registration(_registration_id UUID, _reason TEXT DEFAULT 'Não aprovado')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reg RECORD;
BEGIN
  -- Verificar se é super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can reject registrations';
  END IF;

  -- Buscar registro
  SELECT * INTO v_reg FROM pending_registrations WHERE id = _registration_id;
  
  IF v_reg IS NULL THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  
  IF v_reg.status != 'pending' THEN
    RAISE EXCEPTION 'Registration already processed';
  END IF;

  -- Atualizar como rejeitado
  UPDATE pending_registrations
  SET 
    status = 'rejected',
    rejection_reason = _reason,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = _registration_id;

  -- Log da ação
  INSERT INTO super_admin_actions (super_admin_user_id, action, metadata)
  VALUES (
    auth.uid(), 
    'reject_registration', 
    jsonb_build_object(
      'registration_id', _registration_id,
      'agency_name', v_reg.agency_name,
      'reason', _reason
    )
  );
END;
$$;

-- =============================================
-- FUNÇÃO: get_pending_registrations
-- Retorna todos os registros pendentes (para super admin)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE (
  id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  owner_email TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can view pending registrations';
  END IF;

  RETURN QUERY
  SELECT 
    pr.id,
    pr.agency_name,
    pr.agency_slug,
    pr.owner_email,
    pr.owner_name,
    pr.owner_phone,
    pr.status,
    pr.created_at
  FROM pending_registrations pr
  ORDER BY pr.created_at DESC;
END;
$$;