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

    // ===== GET STARTER PLAN =====
    console.log("[auto-register-agency] Fetching starter plan...");
    const { data: starterPlan, error: starterPlanError } = await supabaseClient
      .from("plans")
      .select("id, trial_days")
      .eq("slug", "starter")
      .eq("active", true)
      .maybeSingle();

    if (starterPlanError || !starterPlan?.id) {
      console.error("[auto-register-agency] Starter plan fetch error:", starterPlanError);
      return errorResponse("Plano padrão não encontrado. Contate o suporte.", 500);
    }

    // ===== CALCULATE DATES =====
    const isLifetime = isAlcateia === true;
    const trialDays = Number(starterPlan.trial_days ?? 14);
    const normalizedTrialDays = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 14;
    
    const endDate = new Date();
    if (isLifetime) {
      endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime = 100 years
    } else {
      endDate.setDate(endDate.getDate() + normalizedTrialDays);
    }

    const agencyStatus = isLifetime ? "active" : "trial";
    const subscriptionStatus = isLifetime ? "active" : "trial";

    console.log(`[auto-register-agency] Creating agency with status: ${agencyStatus}, lifetime: ${isLifetime}`);

    // ===== CREATE AGENCY =====
    const { data: newAgency, error: agencyError } = await supabaseClient
      .from("agencies")
      .insert({
        name: agencyName.trim(),
        slug: agencySlug,
        status: agencyStatus,
        settings: isLifetime 
          ? {
              is_alcateia: true,
              lifetime_access: true,
              alcateia_enrolled_at: new Date().toISOString(),
            }
          : {
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
        plan_id: starterPlan.id,
        status: subscriptionStatus,
        trial_ends_at: isLifetime ? null : endDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
        metadata: { source: isLifetime ? "alcateia-lifetime" : "auto-register-agency" },
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
        is_alcateia: isLifetime,
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

    // ===== CREATE AGENCY LIMITS (with generous limits for Alcateia) =====
    console.log("[auto-register-agency] Creating agency limits...");
    const { error: limitsError } = await supabaseClient.from("agency_limits").upsert(
      {
        agency_id: newAgency.id,
        max_users: isLifetime ? 10 : 3,
        max_leads: isLifetime ? 1000 : 100,
        max_clients: isLifetime ? 100 : 20,
        max_recurring_clients: isLifetime ? 50 : 10,
        storage_mb: isLifetime ? 5120 : 1024,
        features: {
          ai_agents: true,
          funil_tarefas: true,
          funil_avancado: true,
          automacoes: true,
          dashboard_principal: true,
          dashboard_financeiro: isLifetime,
          comissoes: true,
          suporte_email: true,
          exportacao: isLifetime,
          relatorios_agencia: isLifetime,
          assinatura_digital: isLifetime,
          api_access: false,
          is_trial: !isLifetime,
          is_alcateia: isLifetime,
          lifetime_access: isLifetime,
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
        action_type: isLifetime ? "register_agency_alcateia" : "register_agency",
        entity_type: "agency",
        entity_id: newAgency.id,
        entity_name: newAgency.name,
        agency_id: newAgency.id,
        user_id: userId,
        user_name: ownerName.trim(),
        metadata: {
          owner_email: ownerEmail.toLowerCase(),
          source: isLifetime ? "alcateia-lifetime" : "auto-register-agency",
          is_alcateia: isLifetime,
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
      isLifetime,
      trialEndsAt: isLifetime ? null : endDate.toISOString(),
      message: isLifetime 
        ? "Conta criada com sucesso! Você tem acesso vitalício." 
        : "Conta criada com sucesso! Você tem 14 dias de teste grátis.",
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[auto-register-agency] Unhandled error:", error);
    return errorResponse(`Erro inesperado: ${errorMessage}`);
  }
});
