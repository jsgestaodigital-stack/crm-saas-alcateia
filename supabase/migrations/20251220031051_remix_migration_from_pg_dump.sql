CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'operador',
    'visualizador'
);


--
-- Name: client_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_status AS ENUM (
    'on_track',
    'delayed',
    'pending_client'
);


--
-- Name: column_id; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.column_id AS ENUM (
    'pipeline',
    'onboarding',
    'optimization',
    'ready_to_deliver',
    'delivered',
    'suspended',
    'finalized'
);


--
-- Name: commission_payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.commission_payment_status AS ENUM (
    'pending',
    'approved',
    'paid',
    'cancelled'
);


--
-- Name: commission_recipient_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.commission_recipient_type AS ENUM (
    'sdr',
    'seller',
    'photographer',
    'operational',
    'designer',
    'freelancer'
);


--
-- Name: commission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.commission_status AS ENUM (
    'pending',
    'paid',
    'cancelled'
);


--
-- Name: lead_activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_activity_type AS ENUM (
    'whatsapp',
    'call',
    'meeting',
    'note',
    'follow_up',
    'proposal',
    'email'
);


--
-- Name: lead_pipeline_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_pipeline_stage AS ENUM (
    'cold',
    'contacted',
    'qualified',
    'meeting_scheduled',
    'meeting_done',
    'proposal_sent',
    'negotiating',
    'future',
    'gained',
    'lost'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'open',
    'gained',
    'lost',
    'future'
);


--
-- Name: lead_temperature; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_temperature AS ENUM (
    'cold',
    'warm',
    'hot'
);


--
-- Name: photo_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.photo_mode AS ENUM (
    'with_photos',
    'without_photos',
    'pending'
);


--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_type AS ENUM (
    'unique',
    'recurring'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'not_sent',
    'sent',
    'reviewing',
    'approved',
    'rejected'
);


--
-- Name: question_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_status AS ENUM (
    'pending',
    'answered',
    'resolved'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'ativo',
    'suspenso',
    'excluido'
);


--
-- Name: audit_log_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_log_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (audit_log)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: can_access_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE((SELECT can_admin FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;


--
-- Name: can_access_agency(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_agency(_agency_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.agency_members
      WHERE agency_id = _agency_id
        AND user_id = _user_id
    )
$$;


--
-- Name: can_access_finance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_finance(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE((SELECT can_finance FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;


--
-- Name: can_access_ops(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_ops(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE((SELECT can_ops FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;


--
-- Name: can_access_recurring(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_recurring(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE((SELECT can_recurring FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;


--
-- Name: can_access_sales(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_sales(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE((SELECT can_sales FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;


--
-- Name: clients_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clients_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: commission_configs_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commission_configs_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
        BEGIN
          IF NEW.agency_id IS NULL THEN
            NEW.agency_id := public.current_agency_id();
          END IF;

          IF NEW.agency_id IS NULL THEN
            RAISE EXCEPTION 'No current agency selected for this user (commission_configs)';
          END IF;

          RETURN NEW;
        END;
        $$;


--
-- Name: commission_roles_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commission_roles_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
        BEGIN
          IF NEW.agency_id IS NULL THEN
            NEW.agency_id := public.current_agency_id();
          END IF;

          IF NEW.agency_id IS NULL THEN
            RAISE EXCEPTION 'No current agency selected for this user (commission_roles)';
          END IF;

          RETURN NEW;
        END;
        $$;


--
-- Name: commissions_old_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commissions_old_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (commissions_old)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: commissions_v2_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commissions_v2_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (commissions_v2)';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: create_agency_with_owner(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_agency_with_owner(_name text, _slug text, _owner_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_agency_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only Super Admin can create agencies in this MVP
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can create agencies';
  END IF;

  -- Basic input validation
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid agency name';
  END IF;

  IF _slug IS NULL OR length(trim(_slug)) < 2 THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  -- Ensure owner user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _owner_user_id) THEN
    RAISE EXCEPTION 'Owner user not found';
  END IF;

  -- Ensure slug is unique
  IF EXISTS (SELECT 1 FROM public.agencies WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;

  -- Create agency
  INSERT INTO public.agencies (name, slug, status)
  VALUES (trim(_name), trim(_slug), 'active')
  RETURNING id INTO new_agency_id;

  -- Add owner membership
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, _owner_user_id, 'owner')
  ON CONFLICT (agency_id, user_id) DO NOTHING;

  -- Set owner's current agency context (optional but useful)
  UPDATE public.profiles
  SET current_agency_id = new_agency_id,
      updated_at = now()
  WHERE id = _owner_user_id;

  RETURN new_agency_id;
END;
$$;


--
-- Name: current_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_agency_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  selected uuid;
  fallback uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try selected agency from profile
  SELECT p.current_agency_id INTO selected
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF selected IS NOT NULL THEN
    -- Validate that user can access selected agency (still a member or super admin)
    IF public.can_access_agency(selected, auth.uid()) THEN
      RETURN selected;
    END IF;

    -- If invalid, clear it to avoid silent wrong-tenant context
    UPDATE public.profiles
    SET current_agency_id = NULL,
        updated_at = now()
    WHERE id = auth.uid();
  END IF;

  -- Fallback: earliest membership (MVP fallback)
  SELECT am.agency_id INTO fallback
  FROM public.agency_members am
  WHERE am.user_id = auth.uid()
  ORDER BY am.created_at ASC
  LIMIT 1;

  RETURN fallback;
END;
$$;


--
-- Name: delete_lead(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_lead(_lead_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Require sales/admin permission (same intent as leads DELETE RLS)
  IF NOT (can_access_sales(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  -- Clear optional references that would otherwise block the delete
  UPDATE public.commissions_v2
  SET lead_id = NULL
  WHERE lead_id = _lead_id;

  UPDATE public.raiox_analyses
  SET lead_id = NULL
  WHERE lead_id = _lead_id;

  -- Remove dependent rows
  DELETE FROM public.lead_activities
  WHERE lead_id = _lead_id;

  -- Finally delete the lead
  DELETE FROM public.leads
  WHERE id = _lead_id;
END;
$$;


--
-- Name: enforce_commissions_v2_agency_from_clients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_commissions_v2_agency_from_clients() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  a uuid;
BEGIN
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a FROM public.clients c WHERE c.id = cid LIMIT 1;
    IF a IS NOT NULL THEN
      IF NEW.agency_id IS NULL THEN
        NEW.agency_id := a;
      ELSIF NEW.agency_id <> a THEN
        RAISE EXCEPTION 'Tenant mismatch: commissions_v2.agency_id (%) must match clients.agency_id (%)', NEW.agency_id, a;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_lead_activities_agency_from_leads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_lead_activities_agency_from_leads() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  lid uuid;
  a uuid;
BEGIN
  lid := public.try_uuid(to_jsonb(NEW)->>'lead_id');
  IF lid IS NOT NULL THEN
    SELECT l.agency_id INTO a FROM public.leads l WHERE l.id = lid LIMIT 1;
    IF a IS NOT NULL THEN
      IF NEW.agency_id IS NULL THEN
        NEW.agency_id := a;
      ELSIF NEW.agency_id <> a THEN
        RAISE EXCEPTION 'Tenant mismatch: lead_activities.agency_id (%) must match leads.agency_id (%)', NEW.agency_id, a;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_leads_agency_from_clients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_leads_agency_from_clients() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  ccid uuid;
  a1 uuid;
  a2 uuid;
BEGIN
  cid  := public.try_uuid(to_jsonb(NEW)->>'client_id');
  ccid := public.try_uuid(to_jsonb(NEW)->>'converted_client_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a1 FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  IF ccid IS NOT NULL THEN
    SELECT c.agency_id INTO a2 FROM public.clients c WHERE c.id = ccid LIMIT 1;
  END IF;
  IF a1 IS NOT NULL AND a2 IS NOT NULL AND a1 <> a2 THEN
    RAISE EXCEPTION 'Tenant mismatch: leads references clients from different agencies';
  END IF;
  IF a1 IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a1;
    ELSIF NEW.agency_id <> a1 THEN
      RAISE EXCEPTION 'Tenant mismatch: leads.agency_id (%) must match client agency_id (%)', NEW.agency_id, a1;
    END IF;
  ELSIF a2 IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a2;
    ELSIF NEW.agency_id <> a2 THEN
      RAISE EXCEPTION 'Tenant mismatch: leads.agency_id (%) must match converted_client agency_id (%)', NEW.agency_id, a2;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_questions_agency_from_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_questions_agency_from_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  lid uuid;
  a_client uuid;
  a_lead uuid;
BEGIN
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  lid := public.try_uuid(to_jsonb(NEW)->>'lead_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a_client FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  IF lid IS NOT NULL THEN
    SELECT l.agency_id INTO a_lead FROM public.leads l WHERE l.id = lid LIMIT 1;
  END IF;
  IF a_client IS NOT NULL AND a_lead IS NOT NULL AND a_client <> a_lead THEN
    RAISE EXCEPTION 'Tenant mismatch: questions references client and lead from different agencies';
  END IF;
  IF a_client IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_client;
    ELSIF NEW.agency_id <> a_client THEN
      RAISE EXCEPTION 'Tenant mismatch: questions.agency_id (%) must match client agency_id (%)', NEW.agency_id, a_client;
    END IF;
  ELSIF a_lead IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_lead;
    ELSIF NEW.agency_id <> a_lead THEN
      RAISE EXCEPTION 'Tenant mismatch: questions.agency_id (%) must match lead agency_id (%)', NEW.agency_id, a_lead;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_raiox_analyses_agency_from_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_raiox_analyses_agency_from_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  lid uuid;
  a_client uuid;
  a_lead uuid;
BEGIN
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  lid := public.try_uuid(to_jsonb(NEW)->>'lead_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a_client FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  IF lid IS NOT NULL THEN
    SELECT l.agency_id INTO a_lead FROM public.leads l WHERE l.id = lid LIMIT 1;
  END IF;
  IF a_client IS NOT NULL AND a_lead IS NOT NULL AND a_client <> a_lead THEN
    RAISE EXCEPTION 'Tenant mismatch: raiox_analyses references client and lead from different agencies';
  END IF;
  IF a_client IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_client;
    ELSIF NEW.agency_id <> a_client THEN
      RAISE EXCEPTION 'Tenant mismatch: raiox_analyses.agency_id (%) must match client agency_id (%)', NEW.agency_id, a_client;
    END IF;
  ELSIF a_lead IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_lead;
    ELSIF NEW.agency_id <> a_lead THEN
      RAISE EXCEPTION 'Tenant mismatch: raiox_analyses.agency_id (%) must match lead agency_id (%)', NEW.agency_id, a_lead;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_recurring_clients_agency_from_clients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_recurring_clients_agency_from_clients() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  a uuid;
BEGIN
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a FROM public.clients c WHERE c.id = cid LIMIT 1;
    IF a IS NOT NULL THEN
      IF NEW.agency_id IS NULL THEN
        NEW.agency_id := a;
      ELSIF NEW.agency_id <> a THEN
        RAISE EXCEPTION 'Tenant mismatch: recurring_clients.agency_id (%) must match clients.agency_id (%)', NEW.agency_id, a;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_recurring_routines_agency_from_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_recurring_routines_agency_from_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  rcid uuid;
  cid uuid;
  a_rc uuid;
  a_c uuid;
BEGIN
  rcid := public.try_uuid(to_jsonb(NEW)->>'recurring_client_id');
  cid  := public.try_uuid(to_jsonb(NEW)->>'client_id');
  IF rcid IS NOT NULL THEN
    SELECT rc.agency_id INTO a_rc FROM public.recurring_clients rc WHERE rc.id = rcid LIMIT 1;
  END IF;
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a_c FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  IF a_rc IS NOT NULL AND a_c IS NOT NULL AND a_rc <> a_c THEN
    RAISE EXCEPTION 'Tenant mismatch: recurring_routines references recurring_client and client from different agencies';
  END IF;
  IF a_rc IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_rc;
    ELSIF NEW.agency_id <> a_rc THEN
      RAISE EXCEPTION 'Tenant mismatch: recurring_routines.agency_id (%) must match recurring_clients.agency_id (%)', NEW.agency_id, a_rc;
    END IF;
  ELSIF a_c IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_c;
    ELSIF NEW.agency_id <> a_c THEN
      RAISE EXCEPTION 'Tenant mismatch: recurring_routines.agency_id (%) must match clients.agency_id (%)', NEW.agency_id, a_c;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_recurring_tasks_agency_from_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_recurring_tasks_agency_from_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  rcid uuid;
  cid uuid;
  a_rc uuid;
  a_c uuid;
BEGIN
  rcid := public.try_uuid(to_jsonb(NEW)->>'recurring_client_id');
  cid  := public.try_uuid(to_jsonb(NEW)->>'client_id');
  IF rcid IS NOT NULL THEN
    SELECT rc.agency_id INTO a_rc FROM public.recurring_clients rc WHERE rc.id = rcid LIMIT 1;
  END IF;
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a_c FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  IF a_rc IS NOT NULL AND a_c IS NOT NULL AND a_rc <> a_c THEN
    RAISE EXCEPTION 'Tenant mismatch: recurring_tasks references recurring_client and client from different agencies';
  END IF;
  IF a_rc IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_rc;
    ELSIF NEW.agency_id <> a_rc THEN
      RAISE EXCEPTION 'Tenant mismatch: recurring_tasks.agency_id (%) must match recurring_clients.agency_id (%)', NEW.agency_id, a_rc;
    END IF;
  ELSIF a_c IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_c;
    ELSIF NEW.agency_id <> a_c THEN
      RAISE EXCEPTION 'Tenant mismatch: recurring_tasks.agency_id (%) must match clients.agency_id (%)', NEW.agency_id, a_c;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_task_time_entries_agency_from_clients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_task_time_entries_agency_from_clients() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cid uuid;
  a uuid;
BEGIN
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a FROM public.clients c WHERE c.id = cid LIMIT 1;
    IF a IS NOT NULL THEN
      IF NEW.agency_id IS NULL THEN
        NEW.agency_id := a;
      ELSIF NEW.agency_id <> a THEN
        RAISE EXCEPTION 'Tenant mismatch: task_time_entries.agency_id (%) must match clients.agency_id (%)', NEW.agency_id, a;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_permissions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_permissions (user_id, can_sales, can_ops, can_admin, can_finance, can_recurring)
  VALUES (NEW.id, false, false, false, false, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: has_agency_role(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_agency_role(_agency_id uuid, _user_id uuid, _role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members
    WHERE agency_id = _agency_id
      AND user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Super Admin is NOT the same as agency admin.
  -- It must be explicitly granted via user_permissions.is_super_admin = true.
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.user_permissions WHERE user_id = _user_id),
    false
  )
$$;


--
-- Name: lead_activities_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lead_activities_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    v_agency uuid;
  BEGIN
    -- Always prefer lead's agency_id
    IF NEW.lead_id IS NOT NULL THEN
      SELECT agency_id INTO v_agency
      FROM public.leads
      WHERE id = NEW.lead_id
      LIMIT 1;

      IF v_agency IS NOT NULL THEN
        NEW.agency_id := v_agency;
      END IF;
    END IF;

    -- Fallback: current selected agency
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (lead_activities)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: lead_sources_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lead_sources_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (lead_sources)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: leads_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.leads_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_client_agency uuid;
  has_client_id boolean;
  has_converted_client_id boolean;
BEGIN
  -- Detect columns safely
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='client_id'
  ) INTO has_client_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='converted_client_id'
  ) INTO has_converted_client_id;

  IF NEW.agency_id IS NULL THEN
    -- Prefer client_id -> clients.agency_id
    IF has_client_id AND NEW.client_id IS NOT NULL THEN
      SELECT c.agency_id INTO v_client_agency
      FROM public.clients c
      WHERE c.id = NEW.client_id
      LIMIT 1;

      IF v_client_agency IS NOT NULL THEN
        NEW.agency_id := v_client_agency;
      END IF;
    END IF;

    -- Else prefer converted_client_id -> clients.agency_id
    IF NEW.agency_id IS NULL AND has_converted_client_id AND NEW.converted_client_id IS NOT NULL THEN
      SELECT c.agency_id INTO v_client_agency
      FROM public.clients c
      WHERE c.id = NEW.converted_client_id
      LIMIT 1;

      IF v_client_agency IS NOT NULL THEN
        NEW.agency_id := v_client_agency;
      END IF;
    END IF;

    -- Fallback: current selected agency
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (leads)';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: lost_reasons_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lost_reasons_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (lost_reasons)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: questions_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.questions_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    v_agency uuid;
    v_client_uuid uuid;
    v_lead_uuid uuid;
  BEGIN
    -- Prefer client_id -> clients.agency_id
    IF NEW.agency_id IS NULL AND NEW.client_id IS NOT NULL THEN
      BEGIN
        v_client_uuid := public.try_uuid(NEW.client_id::text);
      EXCEPTION WHEN others THEN
        v_client_uuid := NULL;
      END;

      IF v_client_uuid IS NOT NULL THEN
        SELECT c.agency_id INTO v_agency
        FROM public.clients c
        WHERE c.id = v_client_uuid
        LIMIT 1;

        IF v_agency IS NOT NULL THEN
          NEW.agency_id := v_agency;
        END IF;
      END IF;
    END IF;

    -- Else lead_id -> leads.agency_id
    IF NEW.agency_id IS NULL AND NEW.lead_id IS NOT NULL THEN
      BEGIN
        v_lead_uuid := public.try_uuid(NEW.lead_id::text);
      EXCEPTION WHEN others THEN
        v_lead_uuid := NULL;
      END;

      IF v_lead_uuid IS NOT NULL THEN
        SELECT l.agency_id INTO v_agency
        FROM public.leads l
        WHERE l.id = v_lead_uuid
        LIMIT 1;

        IF v_agency IS NOT NULL THEN
          NEW.agency_id := v_agency;
        END IF;
      END IF;
    END IF;

    -- Fallback: current agency context
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (questions)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: raiox_analyses_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.raiox_analyses_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    v_agency uuid;
  BEGIN
    -- Prefer client_id -> clients.agency_id
    IF NEW.agency_id IS NULL AND NEW.client_id IS NOT NULL THEN
      SELECT c.agency_id INTO v_agency
      FROM public.clients c
      WHERE c.id = NEW.client_id
      LIMIT 1;

      IF v_agency IS NOT NULL THEN
        NEW.agency_id := v_agency;
      END IF;
    END IF;

    -- Else lead_id -> leads.agency_id
    IF NEW.agency_id IS NULL AND NEW.lead_id IS NOT NULL THEN
      SELECT l.agency_id INTO v_agency
      FROM public.leads l
      WHERE l.id = NEW.lead_id
      LIMIT 1;

      IF v_agency IS NOT NULL THEN
        NEW.agency_id := v_agency;
      END IF;
    END IF;

    -- Fallback: current agency context
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (raiox_analyses)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: recurring_clients_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recurring_clients_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (recurring_clients)';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: recurring_routines_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recurring_routines_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (recurring_routines)';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: recurring_tasks_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recurring_tasks_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (recurring_tasks)';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: set_current_agency(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_agency(_agency_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must be super admin or member of the agency
  IF NOT public.can_access_agency(_agency_id, auth.uid()) THEN
    RAISE EXCEPTION 'No access to agency';
  END IF;

  UPDATE public.profiles
  SET current_agency_id = _agency_id,
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;


--
-- Name: suggestions_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.suggestions_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (suggestions)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: task_time_entries_set_agency_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.task_time_entries_set_agency_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := public.current_agency_id();
    END IF;

    IF NEW.agency_id IS NULL THEN
      RAISE EXCEPTION 'No current agency selected for this user (task_time_entries)';
    END IF;

    RETURN NEW;
  END;
  $$;


--
-- Name: tenant_healthcheck(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tenant_healthcheck() RETURNS TABLE(tbl_name text, null_agency_id_rows bigint, rls_enabled boolean, force_rls boolean, policies_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
  v_nulls bigint;
  v_rls boolean;
  v_force boolean;
  v_policies int;
BEGIN
  FOR r IN
    SELECT c.relname AS rel_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns ic
        WHERE ic.table_schema='public'
          AND ic.table_name=c.relname
          AND ic.column_name='agency_id'
      )
      AND c.relname <> ALL(ARRAY[
        'agencies',
        'agency_members',
        'profiles',
        'user_roles',
        'user_permissions',
        'tenant_healthcheck_runs',
        'tenant_healthcheck_results'
      ])
    ORDER BY c.relname
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE agency_id IS NULL', r.rel_name) INTO v_nulls;

    SELECT COALESCE(pc.relrowsecurity, false),
           COALESCE(pc.relforcerowsecurity, false)
      INTO v_rls, v_force
    FROM pg_class pc
    JOIN pg_namespace pn ON pn.oid = pc.relnamespace
    WHERE pn.nspname='public' AND pc.relname=r.rel_name;

    SELECT COUNT(*)::int INTO v_policies
    FROM pg_policies pp
    WHERE pp.schemaname='public' AND pp.tablename=r.rel_name;

    tbl_name := r.rel_name;
    null_agency_id_rows := v_nulls;
    rls_enabled := v_rls;
    force_rls := v_force;
    policies_count := v_policies;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;


--
-- Name: try_uuid(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.try_uuid(_val text) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF _val IS NULL OR length(trim(_val)) = 0 THEN
    RETURN NULL;
  END IF;
  BEGIN
    RETURN _val::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$;


--
-- Name: update_lead_last_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lead_last_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.leads 
  SET last_activity_at = now(), updated_at = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agency_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agency_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agency_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'viewer'::text])))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    entity_name text,
    old_value jsonb,
    new_value jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.audit_log FORCE ROW LEVEL SECURITY;


--
-- Name: commissions_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    lead_id uuid,
    client_name text NOT NULL,
    sale_value numeric,
    recipient_type public.commission_recipient_type NOT NULL,
    recipient_name text NOT NULL,
    recipient_id uuid,
    description text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    status public.commission_payment_status DEFAULT 'pending'::public.commission_payment_status NOT NULL,
    delivered_at timestamp with time zone,
    approved_at timestamp with time zone,
    paid_at timestamp with time zone,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recipient_role_id uuid,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL,
    CONSTRAINT commissions_v2_must_have_reference CHECK (((client_id IS NOT NULL) OR (lead_id IS NOT NULL)))
);

ALTER TABLE ONLY public.commissions_v2 FORCE ROW LEVEL SECURITY;


--
-- Name: client_commission_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.client_commission_summary WITH (security_invoker='true') AS
 SELECT client_id,
    client_name,
    max(
        CASE
            WHEN (status <> 'cancelled'::public.commission_payment_status) THEN sale_value
            ELSE NULL::numeric
        END) AS sale_value,
    count(*) AS total_commissions,
    sum(
        CASE
            WHEN (status <> 'cancelled'::public.commission_payment_status) THEN amount
            ELSE (0)::numeric
        END) AS total_commission_amount,
    sum(
        CASE
            WHEN ((status = 'pending'::public.commission_payment_status) OR (status = 'approved'::public.commission_payment_status)) THEN amount
            ELSE (0)::numeric
        END) AS pending_amount,
    sum(
        CASE
            WHEN (status = 'paid'::public.commission_payment_status) THEN amount
            ELSE (0)::numeric
        END) AS paid_amount
   FROM public.commissions_v2
  GROUP BY client_id, client_name;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    google_profile_url text,
    drive_url text,
    whatsapp_group_url text,
    whatsapp_link text,
    whatsapp_link_short text,
    plan_type text DEFAULT 'unique'::text NOT NULL,
    is_owner boolean DEFAULT false NOT NULL,
    main_category text,
    keywords text[],
    notes text,
    briefing text,
    responsible text DEFAULT 'Amanda'::text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    last_update timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'on_track'::text NOT NULL,
    column_id text DEFAULT 'onboarding'::text NOT NULL,
    checklist jsonb DEFAULT '[]'::jsonb NOT NULL,
    comparisons jsonb DEFAULT '[]'::jsonb NOT NULL,
    history jsonb DEFAULT '[]'::jsonb NOT NULL,
    attachments_count integer DEFAULT 0,
    profile_image text,
    cover_config jsonb,
    labels jsonb DEFAULT '[]'::jsonb,
    attachments text[],
    city text,
    photo_mode text DEFAULT 'pending'::text,
    yahoo_email text,
    suspended_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL,
    CONSTRAINT clients_column_id_check CHECK ((column_id = ANY (ARRAY['pipeline'::text, 'onboarding'::text, 'optimization'::text, 'ready_to_deliver'::text, 'delivered'::text, 'suspended'::text, 'finalized'::text]))),
    CONSTRAINT clients_photo_mode_check CHECK ((photo_mode = ANY (ARRAY['with_photos'::text, 'without_photos'::text, 'pending'::text]))),
    CONSTRAINT clients_plan_type_check CHECK ((plan_type = ANY (ARRAY['unique'::text, 'recurring'::text]))),
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['on_track'::text, 'delayed'::text, 'pending_client'::text])))
);

ALTER TABLE ONLY public.clients FORCE ROW LEVEL SECURITY;


--
-- Name: commission_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collaborator_name text NOT NULL,
    collaborator_user_id uuid,
    commission_type text DEFAULT 'operational'::text NOT NULL,
    commission_model text DEFAULT 'fixed'::text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    trigger_event text DEFAULT 'checklist_complete'::text NOT NULL,
    initial_status text DEFAULT 'pending'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.commission_configs FORCE ROW LEVEL SECURITY;


--
-- Name: commission_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.commission_roles FORCE ROW LEVEL SECURITY;


--
-- Name: commissions_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions_old (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    client_name text NOT NULL,
    operator_id uuid,
    operator_name text DEFAULT 'Amanda'::text NOT NULL,
    amount numeric(10,2) DEFAULT 400.00 NOT NULL,
    status public.commission_status DEFAULT 'pending'::public.commission_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone,
    paid_at timestamp with time zone,
    execution_deadline date,
    monitoring_end_date date,
    monitoring_days integer DEFAULT 30 NOT NULL,
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.commissions_old FORCE ROW LEVEL SECURITY;


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    type public.lead_activity_type NOT NULL,
    content text NOT NULL,
    link text,
    created_by uuid NOT NULL,
    created_by_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.lead_activities FORCE ROW LEVEL SECURITY;


--
-- Name: lead_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.lead_sources FORCE ROW LEVEL SECURITY;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    contact_name text,
    whatsapp text,
    phone text,
    email text,
    city text,
    main_category text,
    source_id uuid,
    source_custom text,
    pipeline_stage public.lead_pipeline_stage DEFAULT 'cold'::public.lead_pipeline_stage NOT NULL,
    temperature public.lead_temperature DEFAULT 'cold'::public.lead_temperature NOT NULL,
    probability integer DEFAULT 0,
    estimated_value numeric(10,2),
    next_action text,
    next_action_date date,
    proposal_url text,
    proposal_status public.proposal_status DEFAULT 'not_sent'::public.proposal_status NOT NULL,
    proposal_notes text,
    status public.lead_status DEFAULT 'open'::public.lead_status NOT NULL,
    lost_reason_id uuid,
    lost_notes text,
    converted_client_id uuid,
    converted_at timestamp with time zone,
    notes text,
    responsible text DEFAULT 'João'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL,
    CONSTRAINT leads_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);

ALTER TABLE ONLY public.leads FORCE ROW LEVEL SECURITY;


--
-- Name: lost_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lost_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.lost_reasons FORCE ROW LEVEL SECURITY;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    status public.user_status DEFAULT 'ativo'::public.user_status NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    current_agency_id uuid
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    client_name text NOT NULL,
    asked_by uuid NOT NULL,
    asked_by_name text NOT NULL,
    question text NOT NULL,
    answer text,
    answered_by uuid,
    answered_by_name text,
    status public.question_status DEFAULT 'pending'::public.question_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    answered_at timestamp with time zone,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.questions FORCE ROW LEVEL SECURITY;


--
-- Name: raiox_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.raiox_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    client_id uuid,
    call_link text,
    transcription text,
    summary text,
    objections text,
    closing_angle text,
    next_step text,
    suggested_script text,
    what_to_avoid text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.raiox_analyses FORCE ROW LEVEL SECURITY;


--
-- Name: recurring_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    company_name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    responsible_user_id uuid,
    responsible_name text DEFAULT 'Amanda'::text NOT NULL,
    schedule_variant text DEFAULT 'A'::text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    monthly_value numeric DEFAULT 500,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.recurring_clients FORCE ROW LEVEL SECURITY;


--
-- Name: recurring_routines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_routines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    frequency text DEFAULT 'weekly'::text NOT NULL,
    occurrences_per_period integer DEFAULT 1 NOT NULL,
    rules_json jsonb DEFAULT '{}'::jsonb,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.recurring_routines FORCE ROW LEVEL SECURITY;


--
-- Name: recurring_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recurring_client_id uuid NOT NULL,
    routine_id uuid NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'todo'::text NOT NULL,
    completed_at timestamp with time zone,
    completed_by uuid,
    completed_by_name text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.recurring_tasks FORCE ROW LEVEL SECURITY;


--
-- Name: suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    author_id uuid NOT NULL,
    author_name text NOT NULL,
    target_level text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    archived_at timestamp with time zone,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL,
    CONSTRAINT suggestions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'archived'::text]))),
    CONSTRAINT suggestions_target_level_check CHECK ((target_level = ANY (ARRAY['admin'::text, 'super_admin'::text])))
);

ALTER TABLE ONLY public.suggestions FORCE ROW LEVEL SECURITY;


--
-- Name: task_time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    client_name text NOT NULL,
    task_id text NOT NULL,
    task_title text NOT NULL,
    section_title text NOT NULL,
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    duration_seconds integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_id uuid DEFAULT public.current_agency_id() NOT NULL
);

ALTER TABLE ONLY public.task_time_entries FORCE ROW LEVEL SECURITY;


--
-- Name: tenant_audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_audit_findings (
    run_id bigint NOT NULL,
    severity text NOT NULL,
    table_name text NOT NULL,
    issue text NOT NULL,
    details text,
    fixed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_audit_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_audit_runs (
    id bigint NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL,
    auto_fix boolean DEFAULT true NOT NULL
);


--
-- Name: tenant_audit_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_audit_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_audit_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_audit_runs_id_seq OWNED BY public.tenant_audit_runs.id;


--
-- Name: tenant_fn_audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_fn_audit_findings (
    run_id bigint NOT NULL,
    severity text NOT NULL,
    function_schema text NOT NULL,
    function_name text NOT NULL,
    function_signature text NOT NULL,
    issue text NOT NULL,
    details text,
    recommendation text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_fn_audit_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_fn_audit_runs (
    id bigint NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_fn_audit_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_fn_audit_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_fn_audit_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_fn_audit_runs_id_seq OWNED BY public.tenant_fn_audit_runs.id;


--
-- Name: tenant_healthcheck_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_healthcheck_results (
    run_id bigint NOT NULL,
    table_name text NOT NULL,
    null_agency_id_rows bigint NOT NULL,
    rls_enabled boolean NOT NULL,
    force_rls boolean NOT NULL,
    policies_count integer NOT NULL
);


--
-- Name: tenant_healthcheck_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_healthcheck_runs (
    id bigint NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_healthcheck_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_healthcheck_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_healthcheck_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_healthcheck_runs_id_seq OWNED BY public.tenant_healthcheck_runs.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    user_id uuid NOT NULL,
    can_sales boolean DEFAULT false NOT NULL,
    can_ops boolean DEFAULT false NOT NULL,
    can_admin boolean DEFAULT false NOT NULL,
    can_finance boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    can_recurring boolean DEFAULT false NOT NULL,
    is_super_admin boolean DEFAULT false NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'visualizador'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_audit_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_audit_runs ALTER COLUMN id SET DEFAULT nextval('public.tenant_audit_runs_id_seq'::regclass);


--
-- Name: tenant_fn_audit_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_fn_audit_runs ALTER COLUMN id SET DEFAULT nextval('public.tenant_fn_audit_runs_id_seq'::regclass);


--
-- Name: tenant_healthcheck_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_healthcheck_runs ALTER COLUMN id SET DEFAULT nextval('public.tenant_healthcheck_runs_id_seq'::regclass);


--
-- Name: agencies agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (id);


--
-- Name: agencies agencies_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_slug_key UNIQUE (slug);


--
-- Name: agency_members agency_members_agency_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_user_id_key UNIQUE (agency_id, user_id);


--
-- Name: agency_members agency_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: commission_configs commission_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_configs
    ADD CONSTRAINT commission_configs_pkey PRIMARY KEY (id);


--
-- Name: commission_roles commission_roles_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_roles
    ADD CONSTRAINT commission_roles_label_key UNIQUE (label);


--
-- Name: commission_roles commission_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_roles
    ADD CONSTRAINT commission_roles_pkey PRIMARY KEY (id);


--
-- Name: commissions_old commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_old
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: commissions_v2 commissions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_v2
    ADD CONSTRAINT commissions_v2_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_sources lead_sources_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_sources
    ADD CONSTRAINT lead_sources_label_key UNIQUE (label);


--
-- Name: lead_sources lead_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_sources
    ADD CONSTRAINT lead_sources_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: lost_reasons lost_reasons_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_reasons
    ADD CONSTRAINT lost_reasons_label_key UNIQUE (label);


--
-- Name: lost_reasons lost_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_reasons
    ADD CONSTRAINT lost_reasons_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: raiox_analyses raiox_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raiox_analyses
    ADD CONSTRAINT raiox_analyses_pkey PRIMARY KEY (id);


--
-- Name: recurring_clients recurring_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_clients
    ADD CONSTRAINT recurring_clients_pkey PRIMARY KEY (id);


--
-- Name: recurring_routines recurring_routines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_routines
    ADD CONSTRAINT recurring_routines_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_recurring_client_id_routine_id_due_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_recurring_client_id_routine_id_due_date_key UNIQUE (recurring_client_id, routine_id, due_date);


--
-- Name: suggestions suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_pkey PRIMARY KEY (id);


--
-- Name: task_time_entries task_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_time_entries
    ADD CONSTRAINT task_time_entries_pkey PRIMARY KEY (id);


--
-- Name: tenant_audit_runs tenant_audit_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_audit_runs
    ADD CONSTRAINT tenant_audit_runs_pkey PRIMARY KEY (id);


--
-- Name: tenant_fn_audit_runs tenant_fn_audit_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_fn_audit_runs
    ADD CONSTRAINT tenant_fn_audit_runs_pkey PRIMARY KEY (id);


--
-- Name: tenant_healthcheck_results tenant_healthcheck_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_healthcheck_results
    ADD CONSTRAINT tenant_healthcheck_results_pkey PRIMARY KEY (run_id, table_name);


--
-- Name: tenant_healthcheck_runs tenant_healthcheck_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_healthcheck_runs
    ADD CONSTRAINT tenant_healthcheck_runs_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_agency_members_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agency_members_agency_id ON public.agency_members USING btree (agency_id);


--
-- Name: idx_agency_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agency_members_user_id ON public.agency_members USING btree (user_id);


--
-- Name: idx_audit_log_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_action_type ON public.audit_log USING btree (action_type);


--
-- Name: idx_audit_log_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_agency_id ON public.audit_log USING btree (agency_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_entity_type ON public.audit_log USING btree (entity_type);


--
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- Name: idx_clients_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_agency_id ON public.clients USING btree (agency_id);


--
-- Name: idx_clients_column_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_column_id ON public.clients USING btree (column_id);


--
-- Name: idx_clients_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_company_name ON public.clients USING btree (company_name);


--
-- Name: idx_clients_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_deleted_at ON public.clients USING btree (deleted_at);


--
-- Name: idx_clients_responsible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_responsible ON public.clients USING btree (responsible);


--
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- Name: idx_commission_configs_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commission_configs_agency_id ON public.commission_configs USING btree (agency_id);


--
-- Name: idx_commission_roles_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commission_roles_agency_id ON public.commission_roles USING btree (agency_id);


--
-- Name: idx_commissions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_created ON public.commissions_old USING btree (created_at DESC);


--
-- Name: idx_commissions_old_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_old_agency_id ON public.commissions_old USING btree (agency_id);


--
-- Name: idx_commissions_operator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_operator ON public.commissions_old USING btree (operator_id);


--
-- Name: idx_commissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_status ON public.commissions_old USING btree (status);


--
-- Name: idx_commissions_v2_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_v2_agency_id ON public.commissions_v2 USING btree (agency_id);


--
-- Name: idx_commissions_v2_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_v2_client_id ON public.commissions_v2 USING btree (client_id);


--
-- Name: idx_commissions_v2_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_v2_lead_id ON public.commissions_v2 USING btree (lead_id);


--
-- Name: idx_commissions_v2_recipient_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_v2_recipient_type ON public.commissions_v2 USING btree (recipient_type);


--
-- Name: idx_commissions_v2_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_v2_status ON public.commissions_v2 USING btree (status);


--
-- Name: idx_lead_activities_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_agency_id ON public.lead_activities USING btree (agency_id);


--
-- Name: idx_lead_activities_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);


--
-- Name: idx_lead_sources_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_sources_agency_id ON public.lead_sources USING btree (agency_id);


--
-- Name: idx_leads_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_agency_id ON public.leads USING btree (agency_id);


--
-- Name: idx_lost_reasons_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lost_reasons_agency_id ON public.lost_reasons USING btree (agency_id);


--
-- Name: idx_profiles_current_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_current_agency_id ON public.profiles USING btree (current_agency_id);


--
-- Name: idx_questions_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_agency_id ON public.questions USING btree (agency_id);


--
-- Name: idx_raiox_analyses_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raiox_analyses_agency_id ON public.raiox_analyses USING btree (agency_id);


--
-- Name: idx_recurring_clients_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_clients_agency_id ON public.recurring_clients USING btree (agency_id);


--
-- Name: idx_recurring_clients_responsible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_clients_responsible ON public.recurring_clients USING btree (responsible_user_id);


--
-- Name: idx_recurring_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_clients_status ON public.recurring_clients USING btree (status);


--
-- Name: idx_recurring_routines_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_routines_agency_id ON public.recurring_routines USING btree (agency_id);


--
-- Name: idx_recurring_tasks_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_tasks_agency_id ON public.recurring_tasks USING btree (agency_id);


--
-- Name: idx_recurring_tasks_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_tasks_client ON public.recurring_tasks USING btree (recurring_client_id);


--
-- Name: idx_recurring_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_tasks_due_date ON public.recurring_tasks USING btree (due_date);


--
-- Name: idx_recurring_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_tasks_status ON public.recurring_tasks USING btree (status);


--
-- Name: idx_suggestions_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suggestions_agency_id ON public.suggestions USING btree (agency_id);


--
-- Name: idx_task_time_entries_agency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_time_entries_agency_id ON public.task_time_entries USING btree (agency_id);


--
-- Name: idx_task_time_entries_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_time_entries_client ON public.task_time_entries USING btree (client_id);


--
-- Name: idx_task_time_entries_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_time_entries_created ON public.task_time_entries USING btree (created_at DESC);


--
-- Name: idx_task_time_entries_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_time_entries_task ON public.task_time_entries USING btree (task_id);


--
-- Name: idx_task_time_entries_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_time_entries_user ON public.task_time_entries USING btree (user_id);


--
-- Name: profiles on_profile_created_create_permissions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_created_create_permissions AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: audit_log trg_audit_log_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_log_set_agency_id BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_log_set_agency_id();


--
-- Name: clients trg_clients_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clients_set_agency_id BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.clients_set_agency_id();


--
-- Name: commission_configs trg_commission_configs_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_commission_configs_set_agency_id BEFORE INSERT ON public.commission_configs FOR EACH ROW EXECUTE FUNCTION public.commission_configs_set_agency_id();


--
-- Name: commission_roles trg_commission_roles_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_commission_roles_set_agency_id BEFORE INSERT ON public.commission_roles FOR EACH ROW EXECUTE FUNCTION public.commission_roles_set_agency_id();


--
-- Name: commissions_old trg_commissions_old_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_commissions_old_set_agency_id BEFORE INSERT ON public.commissions_old FOR EACH ROW EXECUTE FUNCTION public.commissions_old_set_agency_id();


--
-- Name: commissions_v2 trg_commissions_v2_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_commissions_v2_set_agency_id BEFORE INSERT ON public.commissions_v2 FOR EACH ROW EXECUTE FUNCTION public.commissions_v2_set_agency_id();


--
-- Name: commissions_v2 trg_enforce_commissions_v2_agency_from_clients; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_commissions_v2_agency_from_clients BEFORE INSERT OR UPDATE ON public.commissions_v2 FOR EACH ROW EXECUTE FUNCTION public.enforce_commissions_v2_agency_from_clients();


--
-- Name: lead_activities trg_enforce_lead_activities_agency_from_leads; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_lead_activities_agency_from_leads BEFORE INSERT OR UPDATE ON public.lead_activities FOR EACH ROW EXECUTE FUNCTION public.enforce_lead_activities_agency_from_leads();


--
-- Name: leads trg_enforce_leads_agency_from_clients; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_leads_agency_from_clients BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.enforce_leads_agency_from_clients();


--
-- Name: questions trg_enforce_questions_agency_from_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_questions_agency_from_parent BEFORE INSERT OR UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.enforce_questions_agency_from_parent();


--
-- Name: raiox_analyses trg_enforce_raiox_analyses_agency_from_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_raiox_analyses_agency_from_parent BEFORE INSERT OR UPDATE ON public.raiox_analyses FOR EACH ROW EXECUTE FUNCTION public.enforce_raiox_analyses_agency_from_parent();


--
-- Name: recurring_clients trg_enforce_recurring_clients_agency_from_clients; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_recurring_clients_agency_from_clients BEFORE INSERT OR UPDATE ON public.recurring_clients FOR EACH ROW EXECUTE FUNCTION public.enforce_recurring_clients_agency_from_clients();


--
-- Name: recurring_routines trg_enforce_recurring_routines_agency_from_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_recurring_routines_agency_from_parent BEFORE INSERT OR UPDATE ON public.recurring_routines FOR EACH ROW EXECUTE FUNCTION public.enforce_recurring_routines_agency_from_parent();


--
-- Name: recurring_tasks trg_enforce_recurring_tasks_agency_from_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_recurring_tasks_agency_from_parent BEFORE INSERT OR UPDATE ON public.recurring_tasks FOR EACH ROW EXECUTE FUNCTION public.enforce_recurring_tasks_agency_from_parent();


--
-- Name: task_time_entries trg_enforce_task_time_entries_agency_from_clients; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_task_time_entries_agency_from_clients BEFORE INSERT OR UPDATE ON public.task_time_entries FOR EACH ROW EXECUTE FUNCTION public.enforce_task_time_entries_agency_from_clients();


--
-- Name: lead_activities trg_lead_activities_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lead_activities_set_agency_id BEFORE INSERT ON public.lead_activities FOR EACH ROW EXECUTE FUNCTION public.lead_activities_set_agency_id();


--
-- Name: lead_sources trg_lead_sources_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lead_sources_set_agency_id BEFORE INSERT ON public.lead_sources FOR EACH ROW EXECUTE FUNCTION public.lead_sources_set_agency_id();


--
-- Name: leads trg_leads_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_leads_set_agency_id BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.leads_set_agency_id();


--
-- Name: lost_reasons trg_lost_reasons_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lost_reasons_set_agency_id BEFORE INSERT ON public.lost_reasons FOR EACH ROW EXECUTE FUNCTION public.lost_reasons_set_agency_id();


--
-- Name: questions trg_questions_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_questions_set_agency_id BEFORE INSERT ON public.questions FOR EACH ROW EXECUTE FUNCTION public.questions_set_agency_id();


--
-- Name: raiox_analyses trg_raiox_analyses_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_raiox_analyses_set_agency_id BEFORE INSERT ON public.raiox_analyses FOR EACH ROW EXECUTE FUNCTION public.raiox_analyses_set_agency_id();


--
-- Name: recurring_clients trg_recurring_clients_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recurring_clients_set_agency_id BEFORE INSERT ON public.recurring_clients FOR EACH ROW EXECUTE FUNCTION public.recurring_clients_set_agency_id();


--
-- Name: recurring_routines trg_recurring_routines_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recurring_routines_set_agency_id BEFORE INSERT ON public.recurring_routines FOR EACH ROW EXECUTE FUNCTION public.recurring_routines_set_agency_id();


--
-- Name: recurring_tasks trg_recurring_tasks_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recurring_tasks_set_agency_id BEFORE INSERT ON public.recurring_tasks FOR EACH ROW EXECUTE FUNCTION public.recurring_tasks_set_agency_id();


--
-- Name: suggestions trg_suggestions_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_suggestions_set_agency_id BEFORE INSERT ON public.suggestions FOR EACH ROW EXECUTE FUNCTION public.suggestions_set_agency_id();


--
-- Name: task_time_entries trg_task_time_entries_set_agency_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_task_time_entries_set_agency_id BEFORE INSERT ON public.task_time_entries FOR EACH ROW EXECUTE FUNCTION public.task_time_entries_set_agency_id();


--
-- Name: lead_activities trigger_update_lead_last_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_lead_last_activity AFTER INSERT ON public.lead_activities FOR EACH ROW EXECUTE FUNCTION public.update_lead_last_activity();


--
-- Name: agencies update_agencies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: commission_configs update_commission_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_commission_configs_updated_at BEFORE UPDATE ON public.commission_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commissions_old update_commissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions_old FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commissions_v2 update_commissions_v2_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_commissions_v2_updated_at BEFORE UPDATE ON public.commissions_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: questions update_questions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recurring_clients update_recurring_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recurring_clients_updated_at BEFORE UPDATE ON public.recurring_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recurring_routines update_recurring_routines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recurring_routines_updated_at BEFORE UPDATE ON public.recurring_routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recurring_tasks update_recurring_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON public.recurring_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suggestions update_suggestions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON public.suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_permissions update_user_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agency_members agency_members_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE CASCADE;


--
-- Name: agency_members agency_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: clients clients_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: commission_configs commission_configs_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_configs
    ADD CONSTRAINT commission_configs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: commission_roles commission_roles_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_roles
    ADD CONSTRAINT commission_roles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: commissions_old commissions_old_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_old
    ADD CONSTRAINT commissions_old_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: commissions_old commissions_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_old
    ADD CONSTRAINT commissions_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: commissions_v2 commissions_v2_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_v2
    ADD CONSTRAINT commissions_v2_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: commissions_v2 commissions_v2_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_v2
    ADD CONSTRAINT commissions_v2_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: commissions_v2 commissions_v2_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_v2
    ADD CONSTRAINT commissions_v2_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: commissions_v2 commissions_v2_recipient_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions_v2
    ADD CONSTRAINT commissions_v2_recipient_role_id_fkey FOREIGN KEY (recipient_role_id) REFERENCES public.commission_roles(id);


--
-- Name: lead_activities lead_activities_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_sources lead_sources_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_sources
    ADD CONSTRAINT lead_sources_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: leads leads_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: leads leads_lost_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_lost_reason_id_fkey FOREIGN KEY (lost_reason_id) REFERENCES public.lost_reasons(id);


--
-- Name: leads leads_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.lead_sources(id);


--
-- Name: lost_reasons lost_reasons_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lost_reasons
    ADD CONSTRAINT lost_reasons_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: profiles profiles_current_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_current_agency_id_fkey FOREIGN KEY (current_agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: questions questions_answered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_answered_by_fkey FOREIGN KEY (answered_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: questions questions_asked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_asked_by_fkey FOREIGN KEY (asked_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: raiox_analyses raiox_analyses_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raiox_analyses
    ADD CONSTRAINT raiox_analyses_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: raiox_analyses raiox_analyses_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raiox_analyses
    ADD CONSTRAINT raiox_analyses_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: raiox_analyses raiox_analyses_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raiox_analyses
    ADD CONSTRAINT raiox_analyses_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: recurring_clients recurring_clients_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_clients
    ADD CONSTRAINT recurring_clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: recurring_clients recurring_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_clients
    ADD CONSTRAINT recurring_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: recurring_routines recurring_routines_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_routines
    ADD CONSTRAINT recurring_routines_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: recurring_tasks recurring_tasks_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: recurring_tasks recurring_tasks_recurring_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_recurring_client_id_fkey FOREIGN KEY (recurring_client_id) REFERENCES public.recurring_clients(id) ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_routine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.recurring_routines(id) ON DELETE CASCADE;


--
-- Name: suggestions suggestions_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: task_time_entries task_time_entries_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_time_entries
    ADD CONSTRAINT task_time_entries_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE RESTRICT;


--
-- Name: task_time_entries task_time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_time_entries
    ADD CONSTRAINT task_time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tenant_audit_findings tenant_audit_findings_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_audit_findings
    ADD CONSTRAINT tenant_audit_findings_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.tenant_audit_runs(id) ON DELETE CASCADE;


--
-- Name: tenant_fn_audit_findings tenant_fn_audit_findings_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_fn_audit_findings
    ADD CONSTRAINT tenant_fn_audit_findings_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.tenant_fn_audit_runs(id) ON DELETE CASCADE;


--
-- Name: tenant_healthcheck_results tenant_healthcheck_results_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_healthcheck_results
    ADD CONSTRAINT tenant_healthcheck_results_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.tenant_healthcheck_runs(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_log Admins can delete audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete audit logs" ON public.audit_log FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: commissions_old Admins can delete commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete commissions" ON public.commissions_old FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: commissions_v2 Admins can delete commissions_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete commissions_v2" ON public.commissions_v2 FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: lead_activities Admins can delete lead activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete lead activities" ON public.lead_activities FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: questions Admins can delete questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete questions" ON public.questions FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: raiox_analyses Admins can delete raiox analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete raiox analyses" ON public.raiox_analyses FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: recurring_clients Admins can delete recurring_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete recurring_clients" ON public.recurring_clients FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: recurring_tasks Admins can delete recurring_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete recurring_tasks" ON public.recurring_tasks FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: task_time_entries Admins can delete time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete time entries" ON public.task_time_entries FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: commissions_old Admins can insert commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert commissions" ON public.commissions_old FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: commissions_v2 Admins can insert commissions_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert commissions_v2" ON public.commissions_v2 FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: commission_configs Admins can manage commission configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage commission configs" ON public.commission_configs USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: commission_roles Admins can manage commission roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage commission roles" ON public.commission_roles TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: lead_sources Admins can manage lead sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage lead sources" ON public.lead_sources TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: lost_reasons Admins can manage lost reasons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage lost reasons" ON public.lost_reasons TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: user_permissions Admins can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage permissions" ON public.user_permissions TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: recurring_routines Admins can manage routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage routines" ON public.recurring_routines USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: commissions_old Admins can update commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update commissions" ON public.commissions_old FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: commissions_v2 Admins can update commissions_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update commissions_v2" ON public.commissions_v2 FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: questions Admins can update questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update questions" ON public.questions FOR UPDATE TO authenticated USING ((public.is_admin(auth.uid()) OR (auth.uid() = asked_by))) WITH CHECK ((public.is_admin(auth.uid()) OR (auth.uid() = asked_by)));


--
-- Name: suggestions Admins can update suggestions status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update suggestions status" ON public.suggestions FOR UPDATE USING ((((target_level = 'admin'::text) AND public.is_admin(auth.uid()) AND (NOT public.is_super_admin(auth.uid()))) OR ((target_level = 'super_admin'::text) AND public.is_super_admin(auth.uid())))) WITH CHECK ((((target_level = 'admin'::text) AND public.is_admin(auth.uid()) AND (NOT public.is_super_admin(auth.uid()))) OR ((target_level = 'super_admin'::text) AND public.is_super_admin(auth.uid()))));


--
-- Name: audit_log Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_log FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: commissions_old Admins can view all commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all commissions" ON public.commissions_old FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: commissions_v2 Admins can view all commissions_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all commissions_v2" ON public.commissions_v2 FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_permissions Admins can view all permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all permissions" ON public.user_permissions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: suggestions Admins can view suggestions from colaboradores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view suggestions from colaboradores" ON public.suggestions FOR SELECT USING (((target_level = 'admin'::text) AND public.is_admin(auth.uid()) AND (NOT public.is_super_admin(auth.uid()))));


--
-- Name: audit_log Authenticated users can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: task_time_entries Ops or admin can create time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ops or admin can create time entries" ON public.task_time_entries FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (public.can_access_ops(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))));


--
-- Name: questions Ops or admin can view questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ops or admin can view questions" ON public.questions FOR SELECT USING ((public.can_access_ops(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: task_time_entries Ops or admin can view time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ops or admin can view time entries" ON public.task_time_entries FOR SELECT USING ((public.can_access_ops(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_clients Recurring or admin can insert recurring_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can insert recurring_clients" ON public.recurring_clients FOR INSERT WITH CHECK ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_tasks Recurring or admin can insert recurring_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can insert recurring_tasks" ON public.recurring_tasks FOR INSERT WITH CHECK ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_clients Recurring or admin can update recurring_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can update recurring_clients" ON public.recurring_clients FOR UPDATE USING ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))) WITH CHECK ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_tasks Recurring or admin can update recurring_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can update recurring_tasks" ON public.recurring_tasks FOR UPDATE USING ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))) WITH CHECK ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_clients Recurring or admin can view recurring_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can view recurring_clients" ON public.recurring_clients FOR SELECT USING ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_tasks Recurring or admin can view recurring_tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can view recurring_tasks" ON public.recurring_tasks FOR SELECT USING ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: recurring_routines Recurring or admin can view routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recurring or admin can view routines" ON public.recurring_routines FOR SELECT USING ((public.can_access_recurring(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: leads Sales or admin can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can delete leads" ON public.leads FOR DELETE TO authenticated USING ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: lead_activities Sales or admin can insert lead activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can insert lead activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (((auth.uid() = created_by) AND (public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))));


--
-- Name: leads Sales or admin can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: raiox_analyses Sales or admin can insert raiox analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can insert raiox analyses" ON public.raiox_analyses FOR INSERT WITH CHECK (((auth.uid() = created_by) AND (public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))));


--
-- Name: leads Sales or admin can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can update leads" ON public.leads FOR UPDATE TO authenticated USING ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))) WITH CHECK ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: lead_activities Sales or admin can view lead activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can view lead activities" ON public.lead_activities FOR SELECT TO authenticated USING ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: leads Sales or admin can view leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can view leads" ON public.leads FOR SELECT TO authenticated USING ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: raiox_analyses Sales or admin can view raiox analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales or admin can view raiox analyses" ON public.raiox_analyses FOR SELECT USING ((public.can_access_sales(auth.uid()) OR public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid())));


--
-- Name: suggestions Super admins can view suggestions from admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view suggestions from admins" ON public.suggestions FOR SELECT USING (((target_level = 'super_admin'::text) AND public.is_super_admin(auth.uid())));


--
-- Name: questions Users can create their own questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own questions" ON public.questions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = asked_by));


--
-- Name: suggestions Users can create their own suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own suggestions" ON public.suggestions FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: user_permissions Users can view their own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own permissions" ON public.user_permissions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: suggestions Users can view their own suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own suggestions" ON public.suggestions FOR SELECT USING ((auth.uid() = author_id));


--
-- Name: agencies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

--
-- Name: agencies agencies_delete_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agencies_delete_super_admin ON public.agencies FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: agencies agencies_insert_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agencies_insert_super_admin ON public.agencies FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));


--
-- Name: agencies agencies_select_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agencies_select_access ON public.agencies FOR SELECT TO authenticated USING (public.can_access_agency(id, auth.uid()));


--
-- Name: agencies agencies_update_owner_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agencies_update_owner_admin ON public.agencies FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR public.has_agency_role(id, auth.uid(), 'owner'::text) OR public.has_agency_role(id, auth.uid(), 'admin'::text))) WITH CHECK ((public.is_super_admin(auth.uid()) OR public.has_agency_role(id, auth.uid(), 'owner'::text) OR public.has_agency_role(id, auth.uid(), 'admin'::text)));


--
-- Name: agency_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

--
-- Name: agency_members agency_members_delete_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agency_members_delete_scoped ON public.agency_members FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR public.has_agency_role(agency_id, auth.uid(), 'owner'::text) OR public.has_agency_role(agency_id, auth.uid(), 'admin'::text)));


--
-- Name: agency_members agency_members_insert_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agency_members_insert_scoped ON public.agency_members FOR INSERT TO authenticated WITH CHECK (((public.is_super_admin(auth.uid()) OR public.has_agency_role(agency_id, auth.uid(), 'owner'::text) OR public.has_agency_role(agency_id, auth.uid(), 'admin'::text)) AND ((role <> 'owner'::text) OR public.is_super_admin(auth.uid()))));


--
-- Name: agency_members agency_members_select_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agency_members_select_scoped ON public.agency_members FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.is_super_admin(auth.uid()) OR public.has_agency_role(agency_id, auth.uid(), 'owner'::text) OR public.has_agency_role(agency_id, auth.uid(), 'admin'::text)));


--
-- Name: agency_members agency_members_update_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agency_members_update_scoped ON public.agency_members FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR public.has_agency_role(agency_id, auth.uid(), 'owner'::text) OR public.has_agency_role(agency_id, auth.uid(), 'admin'::text))) WITH CHECK (((public.is_super_admin(auth.uid()) OR public.has_agency_role(agency_id, auth.uid(), 'owner'::text) OR public.has_agency_role(agency_id, auth.uid(), 'admin'::text)) AND ((role <> 'owner'::text) OR public.is_super_admin(auth.uid()))));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_log_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_delete_tenant ON public.audit_log FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: audit_log audit_log_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_insert_tenant ON public.audit_log FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: audit_log audit_log_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select_tenant ON public.audit_log FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: audit_log audit_log_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_update_tenant ON public.audit_log FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: clients clients_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_delete_tenant ON public.clients FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: clients clients_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_insert_tenant ON public.clients FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: clients clients_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_select_tenant ON public.clients FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: clients clients_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_update_tenant ON public.clients FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commission_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: commission_configs commission_configs_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_configs_delete_tenant ON public.commission_configs FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_configs commission_configs_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_configs_insert_tenant ON public.commission_configs FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_configs commission_configs_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_configs_select_tenant ON public.commission_configs FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_configs commission_configs_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_configs_update_tenant ON public.commission_configs FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commission_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: commission_roles commission_roles_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_roles_delete_tenant ON public.commission_roles FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_roles commission_roles_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_roles_insert_tenant ON public.commission_roles FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_roles commission_roles_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_roles_select_tenant ON public.commission_roles FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commission_roles commission_roles_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commission_roles_update_tenant ON public.commission_roles FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_old; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions_old ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions_old commissions_old_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_old_delete_tenant ON public.commissions_old FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_old commissions_old_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_old_insert_tenant ON public.commissions_old FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_old commissions_old_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_old_select_tenant ON public.commissions_old FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_old commissions_old_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_old_update_tenant ON public.commissions_old FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions_v2 commissions_v2_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_v2_delete_tenant ON public.commissions_v2 FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_v2 commissions_v2_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_v2_insert_tenant ON public.commissions_v2 FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_v2 commissions_v2_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_v2_select_tenant ON public.commissions_v2 FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: commissions_v2 commissions_v2_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY commissions_v2_update_tenant ON public.commissions_v2 FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_activities lead_activities_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_activities_delete_tenant ON public.lead_activities FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_activities lead_activities_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_activities_insert_tenant ON public.lead_activities FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_activities lead_activities_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_activities_select_tenant ON public.lead_activities FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_activities lead_activities_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_activities_update_tenant ON public.lead_activities FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_sources lead_sources_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_sources_delete_tenant ON public.lead_sources FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_sources lead_sources_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_sources_insert_tenant ON public.lead_sources FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_sources lead_sources_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_sources_select_tenant ON public.lead_sources FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lead_sources lead_sources_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_sources_update_tenant ON public.lead_sources FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: leads leads_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leads_delete_tenant ON public.leads FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: leads leads_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leads_insert_tenant ON public.leads FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: leads leads_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leads_select_tenant ON public.leads FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: leads leads_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leads_update_tenant ON public.leads FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lost_reasons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lost_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: lost_reasons lost_reasons_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lost_reasons_delete_tenant ON public.lost_reasons FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lost_reasons lost_reasons_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lost_reasons_insert_tenant ON public.lost_reasons FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lost_reasons lost_reasons_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lost_reasons_select_tenant ON public.lost_reasons FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: lost_reasons lost_reasons_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lost_reasons_update_tenant ON public.lost_reasons FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (id = auth.uid())));


--
-- Name: profiles profiles_select_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_self ON public.profiles FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (id = auth.uid())));


--
-- Name: profiles profiles_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (id = auth.uid()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (id = auth.uid())));


--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: questions questions_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY questions_delete_tenant ON public.questions FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: questions questions_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY questions_insert_tenant ON public.questions FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: questions questions_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY questions_select_tenant ON public.questions FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: questions questions_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY questions_update_tenant ON public.questions FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: raiox_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.raiox_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: raiox_analyses raiox_analyses_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY raiox_analyses_delete_tenant ON public.raiox_analyses FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: raiox_analyses raiox_analyses_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY raiox_analyses_insert_tenant ON public.raiox_analyses FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: raiox_analyses raiox_analyses_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY raiox_analyses_select_tenant ON public.raiox_analyses FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: raiox_analyses raiox_analyses_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY raiox_analyses_update_tenant ON public.raiox_analyses FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: recurring_clients recurring_clients_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_clients_delete_tenant ON public.recurring_clients FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_clients recurring_clients_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_clients_insert_tenant ON public.recurring_clients FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_clients recurring_clients_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_clients_select_tenant ON public.recurring_clients FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_clients recurring_clients_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_clients_update_tenant ON public.recurring_clients FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_routines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_routines ENABLE ROW LEVEL SECURITY;

--
-- Name: recurring_routines recurring_routines_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_routines_delete_tenant ON public.recurring_routines FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_routines recurring_routines_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_routines_insert_tenant ON public.recurring_routines FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_routines recurring_routines_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_routines_select_tenant ON public.recurring_routines FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_routines recurring_routines_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_routines_update_tenant ON public.recurring_routines FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: recurring_tasks recurring_tasks_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_tasks_delete_tenant ON public.recurring_tasks FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_tasks recurring_tasks_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_tasks_insert_tenant ON public.recurring_tasks FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_tasks recurring_tasks_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_tasks_select_tenant ON public.recurring_tasks FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: recurring_tasks recurring_tasks_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recurring_tasks_update_tenant ON public.recurring_tasks FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: suggestions suggestions_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suggestions_delete_tenant ON public.suggestions FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: suggestions suggestions_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suggestions_insert_tenant ON public.suggestions FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: suggestions suggestions_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suggestions_select_tenant ON public.suggestions FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: suggestions suggestions_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suggestions_update_tenant ON public.suggestions FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: task_time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: task_time_entries task_time_entries_delete_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_time_entries_delete_tenant ON public.task_time_entries FOR DELETE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: task_time_entries task_time_entries_insert_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_time_entries_insert_tenant ON public.task_time_entries FOR INSERT TO authenticated WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: task_time_entries task_time_entries_select_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_time_entries_select_tenant ON public.task_time_entries FOR SELECT TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: task_time_entries task_time_entries_update_tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_time_entries_update_tenant ON public.task_time_entries FOR UPDATE TO authenticated USING ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id()))) WITH CHECK ((public.is_super_admin(auth.uid()) OR (agency_id = public.current_agency_id())));


--
-- Name: tenant_audit_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_audit_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_audit_findings tenant_audit_findings_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_audit_findings_select_super_admin ON public.tenant_audit_findings FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: tenant_audit_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_audit_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_audit_runs tenant_audit_runs_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_audit_runs_select_super_admin ON public.tenant_audit_runs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: tenant_fn_audit_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_fn_audit_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_fn_audit_findings tenant_fn_audit_findings_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_fn_audit_findings_select_super_admin ON public.tenant_fn_audit_findings FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: tenant_fn_audit_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_fn_audit_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_fn_audit_runs tenant_fn_audit_runs_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_fn_audit_runs_select_super_admin ON public.tenant_fn_audit_runs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: tenant_healthcheck_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_healthcheck_results ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_healthcheck_results tenant_healthcheck_results_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_healthcheck_results_select_super_admin ON public.tenant_healthcheck_results FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: tenant_healthcheck_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_healthcheck_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_healthcheck_runs tenant_healthcheck_runs_select_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_healthcheck_runs_select_super_admin ON public.tenant_healthcheck_runs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));


--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;