-- =====================================================
-- BLINDAGEM ADICIONAL: Atualizar políticas que usam is_admin() 
-- para também incluir validação de current_agency_id()
-- =====================================================

-- COMMISSION_CONFIGS: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage commission configs" ON public.commission_configs;
CREATE POLICY "Admins can manage commission configs" ON public.commission_configs
FOR ALL USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

-- COMMISSION_ROLES: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage commission roles" ON public.commission_roles;
CREATE POLICY "Admins can manage commission roles" ON public.commission_roles
FOR ALL USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

-- COMMISSIONS_OLD: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.commissions_old;
CREATE POLICY "Admins can view all commissions" ON public.commissions_old
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete commissions" ON public.commissions_old;
CREATE POLICY "Admins can delete commissions" ON public.commissions_old
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update commissions" ON public.commissions_old;
CREATE POLICY "Admins can update commissions" ON public.commissions_old
FOR UPDATE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

-- LEAD_SOURCES: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage lead sources" ON public.lead_sources;
CREATE POLICY "Admins can manage lead sources" ON public.lead_sources
FOR ALL USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

-- LOST_REASONS: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage lost reasons" ON public.lost_reasons;
CREATE POLICY "Admins can manage lost reasons" ON public.lost_reasons
FOR ALL USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

-- RECURRING_ROUTINES: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage routines" ON public.recurring_routines;
CREATE POLICY "Admins can manage routines" ON public.recurring_routines
FOR ALL USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR is_super_admin(auth.uid()))
);

-- USER_PERMISSIONS: Adicionar validação de agency_id
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage permissions" ON public.user_permissions
FOR ALL USING (
  is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
CREATE POLICY "Admins can view all permissions" ON public.user_permissions
FOR SELECT USING (
  user_id = auth.uid() 
  OR is_super_admin(auth.uid())
);