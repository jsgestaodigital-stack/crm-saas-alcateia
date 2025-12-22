import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoRegisterRequest {
  agencyName: string;
  agencySlug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  password: string;
  isAlcateia?: boolean; // Flag for lifetime access (Alcateia members)
}

// List of temporary/disposable email domains to block
const BLOCKED_EMAIL_DOMAINS = [
  // Major temporary email providers
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmailo.com",
  "guerrillamail.com", "guerrillamail.org", "guerrillamail.net", "guerrillamail.biz",
  "guerrillamail.de", "grr.la", "sharklasers.com", "guerrillamailblock.com",
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minemail.com",
  "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
  "mailinater.com", "trashmail.com", "trashmail.net", "trashmail.org",
  "throwaway.email", "throwawaymail.com", "throam.com",
  "fakemailgenerator.com", "fakeinbox.com", "fakemail.net",
  "getnada.com", "nada.email", "tempail.com",
  "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf",
  "mohmal.com", "mohmal.im", "mohmal.in", "mohmal.tech",
  "dispostable.com", "mailcatch.com", "maildrop.cc",
  "mintemail.com", "emailondeck.com", "spamgourmet.com",
  "tempr.email", "discard.email", "discardmail.com",
  "tempinbox.com", "mailnesia.com", "tmails.net",
  "tmpmail.org", "tmpmail.net", "burnermail.io",
  "mailsac.com", "inboxkitten.com", "emailfake.com",
  "crazymailing.com", "tempemailco.com", "tmail.com",
  "moakt.com", "mytemp.email", "mt2015.com",
  "emailtemporario.com.br", "emailtemporar.io",
  "getairmail.com", "generator.email", "harakirimail.com",
  "33mail.com", "anonaddy.com", "spamex.com",
  "mailexpire.com", "tempsky.com", "anonymbox.com",
  // Brazilian temporary mail services
  "emailfalso.com", "emailfake.com.br", "emailtemporario.com",
];

function isBlockedEmailDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  return BLOCKED_EMAIL_DOMAINS.some(blocked => 
    domain === blocked || domain.endsWith(`.${blocked}`)
  );
}

// Helper to create error response with proper logging
function errorResponse(message: string, status = 400) {
  console.error(`[auto-register-agency] Error: ${message}`);
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Helper to create success response
function successResponse(data: Record<string, unknown>) {
  console.log(`[auto-register-agency] Success:`, JSON.stringify(data));
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[auto-register-agency] Request received");

  try {
    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse("Configuração do servidor incompleta. Contate o suporte.", 500);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let body: AutoRegisterRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[auto-register-agency] JSON parse error:", parseError);
      return errorResponse("Dados inválidos. Tente novamente.");
    }

    const { agencyName, agencySlug, ownerName, ownerEmail, ownerPhone, password, isAlcateia } = body;

    console.log(`[auto-register-agency] Processing registration for: ${ownerEmail}, isAlcateia: ${isAlcateia}`);

    // ===== INPUT VALIDATION =====
    if (!agencyName?.trim()) {
      return errorResponse("Nome da agência é obrigatório.");
    }
    if (!agencySlug?.trim()) {
      return errorResponse("Slug da agência é obrigatório.");
    }
    if (!ownerName?.trim()) {
      return errorResponse("Nome do responsável é obrigatório.");
    }
    if (!ownerEmail?.trim()) {
      return errorResponse("Email é obrigatório.");
    }
    if (!password) {
      return errorResponse("Senha é obrigatória.");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return errorResponse("Formato de email inválido.");
    }

    // Block temporary/disposable email domains (only for Alcateia)
    if (isAlcateia && isBlockedEmailDomain(ownerEmail)) {
      return errorResponse("Emails temporários não são permitidos. Use seu email pessoal ou profissional.");
    }

    // Password strength validation
    if (password.length < 8) {
      return errorResponse("Senha deve ter pelo menos 8 caracteres.");
    }
    if (!/[A-Z]/.test(password)) {
      return errorResponse("Senha deve conter pelo menos uma letra maiúscula.");
    }
    if (!/[a-z]/.test(password)) {
      return errorResponse("Senha deve conter pelo menos uma letra minúscula.");
    }
    if (!/[0-9]/.test(password)) {
      return errorResponse("Senha deve conter pelo menos um número.");
    }

    // ===== CHECK DUPLICATES =====
    console.log("[auto-register-agency] Checking for duplicate agency slug...");
    const { data: existingAgency, error: existingAgencyError } = await supabaseClient
      .from("agencies")
      .select("id")
      .eq("slug", agencySlug)
      .maybeSingle();

    if (existingAgencyError) {
      console.error("[auto-register-agency] Agency slug check error:", existingAgencyError);
      return errorResponse("Erro ao validar nome da agência. Tente novamente.");
    }

    if (existingAgency) {
      return errorResponse("Uma agência com esse nome já existe. Tente outro nome.");
    }

    console.log("[auto-register-agency] Checking for duplicate email...");
    const { data: existingUsers, error: listUsersError } = await supabaseClient.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error("[auto-register-agency] List users error:", listUsersError);
      return errorResponse("Erro ao verificar email. Tente novamente.");
    }

    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase());
    if (existingUser) {
      return errorResponse("Este email já está cadastrado. Faça login ou use outro email.");
    }

    // ===== CHECK PENDING REGISTRATIONS DUPLICATES =====
    const { data: existingPending } = await supabaseClient
      .from("pending_registrations")
      .select("id, status")
      .eq("owner_email", ownerEmail.toLowerCase())
      .in("status", ["pending"])
      .maybeSingle();

    if (existingPending) {
      return errorResponse("Já existe uma solicitação pendente com este email. Aguarde a aprovação.");
    }

    // ===== ALCATEIA: CREATE FULL ACCESS IMMEDIATELY (NO APPROVAL NEEDED) =====
    if (isAlcateia) {
      console.log("[auto-register-agency] Alcateia registration - creating FULL access immediately...");
      
      // Get the best available plan for Alcateia (lobao > lobinho > any active)
      const { data: lobaooPlan } = await supabaseClient
        .from("plans")
        .select("id")
        .eq("slug", "lobao")
        .eq("active", true)
        .maybeSingle();

      const { data: lobinhoPlan } = await supabaseClient
        .from("plans")
        .select("id")
        .eq("slug", "lobinho")
        .eq("active", true)
        .maybeSingle();

      // Fallback: get ANY active plan
      const { data: anyActivePlan } = await supabaseClient
        .from("plans")
        .select("id")
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      const planId = lobaooPlan?.id || lobinhoPlan?.id || anyActivePlan?.id;
      if (!planId) {
        console.error("[auto-register-agency] No active plan found at all");
        return errorResponse("Nenhum plano ativo encontrado. Contate o suporte.", 500);
      }
      console.log(`[auto-register-agency] Using plan: ${planId}`);

      // ===== CREATE AGENCY FOR ALCATEIA =====
      const { data: alcateiaAgency, error: alcateiaAgencyError } = await supabaseClient
        .from("agencies")
        .insert({
          name: agencyName.trim(),
          slug: agencySlug,
          status: "active", // Immediate active status for Alcateia
          settings: {
            is_alcateia: true,
            lifetime_access: true,
            registered_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (alcateiaAgencyError || !alcateiaAgency) {
        console.error("[auto-register-agency] Alcateia agency creation error:", alcateiaAgencyError);
        return errorResponse(`Erro ao criar agência: ${alcateiaAgencyError?.message || 'Unknown error'}`);
      }

      console.log(`[auto-register-agency] Alcateia agency created: ${alcateiaAgency.id}`);

      // Rollback helper for Alcateia
      const rollbackAlcateia = async (reason: string, userId?: string) => {
        console.error(`[auto-register-agency] Alcateia rolling back: ${reason}`);
        try {
          if (userId) await supabaseClient.auth.admin.deleteUser(userId);
        } catch (e) { console.warn("Rollback: user delete failed", e); }
        try {
          await supabaseClient.from("subscriptions").delete().eq("agency_id", alcateiaAgency.id);
        } catch (e) { console.warn("Rollback: subscription delete failed", e); }
        try {
          await supabaseClient.from("agencies").delete().eq("id", alcateiaAgency.id);
        } catch (e) { console.warn("Rollback: agency delete failed", e); }
      };

      // ===== CREATE SUBSCRIPTION (LIFETIME) =====
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100); // 100 years = lifetime

      const { error: alcateiaSubError } = await supabaseClient
        .from("subscriptions")
        .insert({
          agency_id: alcateiaAgency.id,
          plan_id: planId,
          status: "active", // Immediate active subscription
          trial_ends_at: null, // No trial
          current_period_start: new Date().toISOString(),
          current_period_end: farFutureDate.toISOString(), // "Forever"
          metadata: { source: "alcateia-lifetime", is_alcateia: true },
        });

      if (alcateiaSubError) {
        console.error("[auto-register-agency] Alcateia subscription error:", alcateiaSubError);
        await rollbackAlcateia(`Subscription failed: ${alcateiaSubError.message}`);
        return errorResponse("Erro ao criar assinatura. Tente novamente.");
      }

      // ===== CREATE USER =====
      const { data: alcateiaAuth, error: alcateiaAuthError } = await supabaseClient.auth.admin.createUser({
        email: ownerEmail.toLowerCase().trim(),
        password: password,
        email_confirm: true,
        user_metadata: { 
          full_name: ownerName.trim(),
          phone: ownerPhone?.trim() || null,
          is_alcateia: true,
          lifetime_access: true,
        },
      });

      if (alcateiaAuthError || !alcateiaAuth?.user) {
        console.error("[auto-register-agency] Alcateia user creation error:", alcateiaAuthError);
        await rollbackAlcateia(`User creation failed: ${alcateiaAuthError?.message || 'No user'}`);
        return errorResponse(`Erro ao criar usuário: ${alcateiaAuthError?.message || 'Unknown error'}`);
      }

      const alcateiaUserId = alcateiaAuth.user.id;
      console.log(`[auto-register-agency] Alcateia user created: ${alcateiaUserId}`);

      // ===== CREATE PROFILE WITH AGENCY =====
      const { error: alcateiaProfileError } = await supabaseClient.from("profiles").upsert(
        {
          id: alcateiaUserId,
          full_name: ownerName.trim(),
          current_agency_id: alcateiaAgency.id, // LINKED TO AGENCY
          status: "ativo",
        },
        { onConflict: "id" }
      );

      if (alcateiaProfileError) {
        console.error("[auto-register-agency] Alcateia profile creation error:", alcateiaProfileError);
        await rollbackAlcateia(`Profile failed: ${alcateiaProfileError.message}`, alcateiaUserId);
        return errorResponse("Erro ao criar perfil. Tente novamente.");
      }

      // ===== ADD AS AGENCY OWNER =====
      const { error: alcateiaMemberError } = await supabaseClient.from("agency_members").insert({
        agency_id: alcateiaAgency.id,
        user_id: alcateiaUserId,
        role: "owner",
      });

      if (alcateiaMemberError) {
        console.error("[auto-register-agency] Alcateia member error:", alcateiaMemberError);
        await rollbackAlcateia(`Member failed: ${alcateiaMemberError.message}`, alcateiaUserId);
        return errorResponse("Erro ao vincular usuário à agência. Tente novamente.");
      }

      // ===== SET USER ROLE =====
      const { error: alcateiaRoleError } = await supabaseClient.from("user_roles").upsert(
        {
          user_id: alcateiaUserId,
          agency_id: alcateiaAgency.id,
          role: "admin",
        },
        { onConflict: "user_id,agency_id" }
      );

      if (alcateiaRoleError) {
        console.error("[auto-register-agency] Alcateia role error:", alcateiaRoleError);
        await rollbackAlcateia(`Role failed: ${alcateiaRoleError.message}`, alcateiaUserId);
        return errorResponse("Erro ao definir papel do usuário. Tente novamente.");
      }

      // ===== SET FULL PERMISSIONS =====
      const { error: alcateiaPermError } = await supabaseClient.from("user_permissions").upsert(
        {
          user_id: alcateiaUserId,
          can_sales: true,
          can_ops: true,
          can_admin: true,
          can_finance: true,
          can_recurring: true,
          can_manage_team: true,
          can_manage_settings: true,
          can_manage_commissions: true,
          can_view_reports: true,
          can_view_audit_logs: true,
          can_view_leads: true,
          can_export_data: true,
          can_edit_leads: true,
          can_delete_leads: true,
          can_edit_clients: true,
          can_delete_clients: true,
          is_super_admin: false,
        },
        { onConflict: "user_id" }
      );

      if (alcateiaPermError) {
        console.error("[auto-register-agency] Alcateia permissions error:", alcateiaPermError);
        // Non-critical, continue
      }

      // ===== SET AGENCY LIMITS (GENEROUS FOR ALCATEIA) =====
      const { error: alcateiaLimitsError } = await supabaseClient.from("agency_limits").upsert(
        {
          agency_id: alcateiaAgency.id,
          max_clients: 100,
          max_leads: 500,
          max_users: 10,
          max_recurring_clients: 50,
          storage_mb: 5000,
          features: { ai_agents: true, advanced_reports: true, contracts: true, proposals: true },
        },
        { onConflict: "agency_id" }
      );

      if (alcateiaLimitsError) {
        console.error("[auto-register-agency] Alcateia limits error:", alcateiaLimitsError);
        // Non-critical, continue
      }

      // ===== INITIALIZE USAGE =====
      await supabaseClient.from("agency_usage").upsert(
        {
          agency_id: alcateiaAgency.id,
          current_clients: 0,
          current_leads: 0,
          current_users: 1,
          current_recurring_clients: 0,
          storage_used_mb: 0,
        },
        { onConflict: "agency_id" }
      );

      // ===== ONBOARDING STATUS =====
      try {
        await supabaseClient.from("agency_onboarding_status").insert({
          agency_id: alcateiaAgency.id,
          completed_steps: [],
        });
      } catch (e) {
        console.warn("[auto-register-agency] Onboarding status insert failed (non-critical)", e);
      }

      // ===== AUDIT LOG =====
      try {
        await supabaseClient.from("audit_log").insert({
          agency_id: alcateiaAgency.id,
          user_id: alcateiaUserId,
          user_name: ownerName.trim(),
          action_type: "create",
          entity_type: "agency",
          entity_id: alcateiaAgency.id,
          entity_name: agencyName.trim(),
          new_value: { source: "alcateia-lifetime", is_alcateia: true },
        });
      } catch (e) {
        console.warn("[auto-register-agency] Audit log insert failed (non-critical)", e);
      }

      console.log(`[auto-register-agency] Alcateia registration COMPLETE for ${ownerEmail}`);

      // Return success - user has FULL access now
      return successResponse({
        pending: false,
        agencyId: alcateiaAgency.id,
        userId: alcateiaUserId,
        message: "Conta criada com sucesso! Você já pode acessar o sistema.",
      });
    }

    // ===== REGULAR REGISTRATION (TRIAL) - CONTINUE NORMAL FLOW =====

    // ===== GET DEFAULT PLAN (lobinho as trial plan) =====
    console.log("[auto-register-agency] Fetching default plan...");
    const { data: starterPlan, error: starterPlanError } = await supabaseClient
      .from("plans")
      .select("id, trial_days")
      .eq("slug", "lobinho")
      .eq("active", true)
      .maybeSingle();

    // Fallback: get ANY active plan if lobinho doesn't exist
    const { data: fallbackPlanRegular } = !starterPlan ? await supabaseClient
      .from("plans")
      .select("id, trial_days")
      .eq("active", true)
      .limit(1)
      .maybeSingle() : { data: null };

    const effectivePlan = starterPlan || fallbackPlanRegular;

    if (starterPlanError || !effectivePlan?.id) {
      console.error("[auto-register-agency] Default plan fetch error:", starterPlanError);
      return errorResponse("Plano padrão não encontrado. Contate o suporte.", 500);
    }

    // ===== CALCULATE DATES (Trial flow only - Alcateia already returned above) =====
    const trialDays = Number(effectivePlan.trial_days ?? 14);
    const normalizedTrialDays = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 14;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + normalizedTrialDays);

    const agencyStatus = "trial";
    const subscriptionStatus = "trial";

    console.log(`[auto-register-agency] Creating agency with status: ${agencyStatus}`);

    // ===== CREATE AGENCY =====
    const { data: newAgency, error: agencyError } = await supabaseClient
      .from("agencies")
      .insert({
        name: agencyName.trim(),
        slug: agencySlug,
        status: agencyStatus,
        settings: {
          trial_started_at: new Date().toISOString(),
          trial_ends_at: endDate.toISOString(),
        },
      })
      .select()
      .single();

    if (agencyError || !newAgency) {
      console.error("[auto-register-agency] Agency creation error:", agencyError);
      return errorResponse(`Erro ao criar agência: ${agencyError?.message || 'Unknown error'}`);
    }

    console.log(`[auto-register-agency] Agency created: ${newAgency.id}`);

    // ===== ROLLBACK HELPER =====
    const rollback = async (reason: string, userId?: string) => {
      console.error(`[auto-register-agency] Rolling back due to: ${reason}`);
      try {
        if (userId) {
          await supabaseClient.auth.admin.deleteUser(userId);
          console.log("[auto-register-agency] Rolled back: user deleted");
        }
      } catch (e) {
        console.warn("[auto-register-agency] Rollback: failed to delete user", e);
      }
      try {
        await supabaseClient.from("subscriptions").delete().eq("agency_id", newAgency.id);
        console.log("[auto-register-agency] Rolled back: subscription deleted");
      } catch (e) {
        console.warn("[auto-register-agency] Rollback: failed to delete subscription", e);
      }
      try {
        await supabaseClient.from("agencies").delete().eq("id", newAgency.id);
        console.log("[auto-register-agency] Rolled back: agency deleted");
      } catch (e) {
        console.warn("[auto-register-agency] Rollback: failed to delete agency", e);
      }
    };

    // ===== CREATE SUBSCRIPTION =====
    console.log("[auto-register-agency] Creating subscription...");
    const { error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .insert({
        agency_id: newAgency.id,
        plan_id: effectivePlan.id,
        status: subscriptionStatus,
        trial_ends_at: endDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
        metadata: { source: "auto-register-agency" },
      });

    if (subscriptionError) {
      console.error("[auto-register-agency] Subscription creation error:", subscriptionError);
      await rollback(`Subscription creation failed: ${subscriptionError.message}`);
      return errorResponse("Erro ao criar assinatura. Tente novamente.");
    }

    // ===== CREATE USER =====
    console.log("[auto-register-agency] Creating user...");
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: ownerEmail.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: { 
        full_name: ownerName.trim(),
        phone: ownerPhone?.trim() || null,
        is_alcateia: false,
      },
    });

    if (authError || !authData?.user) {
      console.error("[auto-register-agency] User creation error:", authError);
      await rollback(`User creation failed: ${authError?.message || 'No user returned'}`);
      return errorResponse(`Erro ao criar usuário: ${authError?.message || 'Unknown error'}`);
    }

    const userId = authData.user.id;
    console.log(`[auto-register-agency] User created: ${userId}`);

    // ===== CREATE PROFILE (CRITICAL) =====
    console.log("[auto-register-agency] Creating profile...");
    const { error: profileError } = await supabaseClient.from("profiles").upsert(
      {
        id: userId,
        full_name: ownerName.trim(),
        current_agency_id: newAgency.id, // CRITICAL: This is needed for subscription check
        status: "ativo",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[auto-register-agency] Profile creation error:", profileError);
      await rollback(`Profile creation failed: ${profileError.message}`, userId);
      return errorResponse("Erro ao criar perfil. Tente novamente.");
    }

    // ===== ADD AS AGENCY OWNER =====
    console.log("[auto-register-agency] Adding user as agency owner...");
    const { error: memberError } = await supabaseClient.from("agency_members").insert({
      agency_id: newAgency.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("[auto-register-agency] Agency member creation error:", memberError);
      await rollback(`Agency member creation failed: ${memberError.message}`, userId);
      return errorResponse("Erro ao vincular usuário à agência. Tente novamente.");
    }

    // ===== SET USER ROLE =====
    console.log("[auto-register-agency] Setting user role...");
    const { error: roleError } = await supabaseClient.from("user_roles").upsert(
      {
        user_id: userId,
        agency_id: newAgency.id,
        role: "admin",
      },
      { onConflict: "user_id,agency_id" }
    );

    if (roleError) {
      console.error("[auto-register-agency] User role upsert error:", roleError);
      await rollback(`User role creation failed: ${roleError.message}`, userId);
      return errorResponse("Erro ao definir papel do usuário. Tente novamente.");
    }

    // ===== SET FULL PERMISSIONS =====
    console.log("[auto-register-agency] Setting user permissions...");
    const { error: permError } = await supabaseClient.from("user_permissions").upsert(
      {
        user_id: userId,
        can_sales: true,
        can_ops: true,
        can_admin: true,
        can_finance: true,
        can_recurring: true,
        can_manage_team: true,
        can_manage_settings: true,
        can_manage_commissions: true,
        can_view_reports: true,
        can_view_audit_logs: true,
        can_view_leads: true,
        can_export_data: true,
        can_edit_leads: true,
        can_delete_leads: true,
        can_edit_clients: true,
        can_delete_clients: true,
        is_super_admin: false,
      },
      { onConflict: "user_id" }
    );

    if (permError) {
      console.error("[auto-register-agency] User permissions upsert error:", permError);
      await rollback(`User permissions creation failed: ${permError.message}`, userId);
      return errorResponse("Erro ao definir permissões do usuário. Tente novamente.");
    }

    // ===== CREATE AGENCY LIMITS (Trial limits) =====
    console.log("[auto-register-agency] Creating agency limits...");
    const { error: limitsError } = await supabaseClient.from("agency_limits").upsert(
      {
        agency_id: newAgency.id,
        max_users: 3,
        max_leads: 100,
        max_clients: 20,
        max_recurring_clients: 10,
        storage_mb: 1024,
        features: {
          ai_agents: true,
          funil_tarefas: true,
          funil_avancado: true,
          automacoes: true,
          dashboard_principal: true,
          dashboard_financeiro: false,
          comissoes: true,
          suporte_email: true,
          exportacao: false,
          relatorios_agencia: false,
          assinatura_digital: false,
          api_access: false,
          is_trial: true,
          is_alcateia: false,
          lifetime_access: false,
        },
      },
      { onConflict: "agency_id" }
    );

    if (limitsError) {
      console.error("[auto-register-agency] Agency limits upsert error:", limitsError);
      // Non-critical, continue
    }

    // ===== INITIALIZE USAGE =====
    console.log("[auto-register-agency] Initializing agency usage...");
    const { error: usageError } = await supabaseClient.from("agency_usage").upsert(
      {
        agency_id: newAgency.id,
        current_users: 1,
        current_leads: 0,
        current_clients: 0,
        current_recurring_clients: 0,
        storage_used_mb: 0,
      },
      { onConflict: "agency_id" }
    );

    if (usageError) {
      console.error("[auto-register-agency] Agency usage upsert error:", usageError);
      // Non-critical, continue
    }

    // ===== CREATE ONBOARDING STATUS (best-effort) =====
    try {
      await supabaseClient.from("agency_onboarding_status").insert({
        agency_id: newAgency.id,
        completed_steps: [],
      });
    } catch (e) {
      console.warn("[auto-register-agency] Onboarding status insert failed (non-blocking):", e);
    }

    // ===== AUDIT LOG (best-effort) =====
    try {
      await supabaseClient.from("audit_log").insert({
        action_type: "register_agency",
        entity_type: "agency",
        entity_id: newAgency.id,
        entity_name: newAgency.name,
        agency_id: newAgency.id,
        user_id: userId,
        user_name: ownerName.trim(),
        metadata: {
          owner_email: ownerEmail.toLowerCase(),
          source: "auto-register-agency",
          is_alcateia: false,
        },
      });
    } catch (e) {
      console.warn("[auto-register-agency] Failed to write audit log:", e);
    }

    console.log(`[auto-register-agency] Registration complete for ${ownerEmail}`);

    // ===== SUCCESS RESPONSE =====
    return successResponse({
      userId,
      agencyId: newAgency.id,
      email: ownerEmail.toLowerCase(),
      isLifetime: false,
      trialEndsAt: endDate.toISOString(),
      message: "Conta criada com sucesso! Você tem 14 dias de teste grátis.",
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[auto-register-agency] Unhandled error:", error);
    return errorResponse(`Erro inesperado: ${errorMessage}`);
  }
});
