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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: AutoRegisterRequest = await req.json();
    const { agencyName, agencySlug, ownerName, ownerEmail, ownerPhone, password } = body;

    // Validate required fields
    if (!agencyName || !agencySlug || !ownerName || !ownerEmail || !password) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength (mínimo: 8+, 1 maiúscula, 1 minúscula, 1 número)
    if (password.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres");
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("Senha deve conter pelo menos uma letra maiúscula");
    }
    if (!/[a-z]/.test(password)) {
      throw new Error("Senha deve conter pelo menos uma letra minúscula");
    }
    if (!/[0-9]/.test(password)) {
      throw new Error("Senha deve conter pelo menos um número");
    }
    // Check if agency slug already exists
    const { data: existingAgency, error: existingAgencyError } = await supabaseClient
      .from("agencies")
      .select("id")
      .eq("slug", agencySlug)
      .maybeSingle();

    if (existingAgencyError) {
      console.error("Agency slug check error:", existingAgencyError);
      throw new Error("Erro ao validar nome da agência. Tente novamente.");
    }

    if (existingAgency) {
      throw new Error("Uma agência com esse nome já existe. Tente outro nome.");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === ownerEmail.toLowerCase());

    if (existingUser) {
      throw new Error("Este email já está cadastrado. Faça login ou use outro email.");
    }

    // Get default plan (Starter) to link the trial subscription
    const { data: starterPlan, error: starterPlanError } = await supabaseClient
      .from("plans")
      .select("id, trial_days")
      .eq("slug", "starter")
      .eq("active", true)
      .maybeSingle();

    if (starterPlanError || !starterPlan?.id) {
      console.error("Starter plan fetch error:", starterPlanError);
      throw new Error(
        "Não foi possível iniciar o teste grátis (plano padrão não encontrado)."
      );
    }

    // Create agency with trial status
    const trialDays = Number(starterPlan.trial_days ?? 14);
    const normalizedTrialDays = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 14;

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + normalizedTrialDays);

    const { data: newAgency, error: agencyError } = await supabaseClient
      .from("agencies")
      .insert({
        name: agencyName,
        slug: agencySlug,
        status: "trial",
        settings: {
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEndDate.toISOString(),
        },
      })
      .select()
      .single();

    if (agencyError) {
      console.error("Agency creation error:", agencyError);
      throw new Error(`Erro ao criar agência: ${agencyError.message}`);
    }

    // Create subscription row (required for access checks)
    const { error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .insert({
        agency_id: newAgency.id,
        plan_id: starterPlan.id,
        status: "trial",
        trial_ends_at: trialEndDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
        metadata: { source: "auto-register-agency" },
      });

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      await supabaseClient.from("subscriptions").delete().eq("agency_id", newAgency.id);
      await supabaseClient.from("agencies").delete().eq("id", newAgency.id);
      throw new Error(`Erro ao iniciar teste grátis: ${subscriptionError.message}`);
    }

    // Create user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: ownerEmail.toLowerCase(),
      password: password,
      email_confirm: true, // Auto confirm email for trial
      user_metadata: { 
        full_name: ownerName,
        phone: ownerPhone,
      },
    });

    if (authError) {
      // Rollback agency creation
      await supabaseClient.from("agencies").delete().eq("id", newAgency.id);
      console.error("User creation error:", authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    const userId = authData.user.id;

    const rollback = async (reason: string) => {
      try {
        await supabaseClient.auth.admin.deleteUser(userId);
      } catch (e) {
        console.warn("Rollback: failed to delete user", e);
      }
      try {
        await supabaseClient.from("subscriptions").delete().eq("agency_id", newAgency.id);
      } catch (e) {
        console.warn("Rollback: failed to delete subscription", e);
      }
      try {
        await supabaseClient.from("agencies").delete().eq("id", newAgency.id);
      } catch (e) {
        console.warn("Rollback: failed to delete agency", e);
      }
      throw new Error(reason);
    };

    // Create profile (required for selecting current agency)
    const { error: profileError } = await supabaseClient.from("profiles").upsert(
      {
        id: userId,
        full_name: ownerName,
        current_agency_id: newAgency.id,
        status: "active",
        // Nota: a tabela public.profiles não possui a coluna 'phone'.
        // O telefone permanece salvo em auth.user_metadata.
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile creation error:", profileError);
      await rollback(`Erro ao criar perfil: ${profileError.message}`);
    }

    // Add as agency owner
    const { error: memberError } = await supabaseClient.from("agency_members").insert({
      agency_id: newAgency.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("Agency member creation error:", memberError);
      await rollback(`Erro ao vincular usuário à agência: ${memberError.message}`);
    }

    // Set user role as admin (per-agency)
    const { error: roleError } = await supabaseClient.from("user_roles").upsert(
      {
        user_id: userId,
        agency_id: newAgency.id,
        role: "admin",
      },
      { onConflict: "user_id,agency_id" }
    );

    if (roleError) {
      console.error("User role upsert error:", roleError);
      await rollback(`Erro ao definir papel do usuário: ${roleError.message}`);
    }

    // Set full permissions for owner (global)
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
      console.error("User permissions upsert error:", permError);
      await rollback(`Erro ao definir permissões do usuário: ${permError.message}`);
    }

    // Create trial limits (required by features/limits checks)
    const { error: limitsError } = await supabaseClient.from("agency_limits").upsert(
      {
        agency_id: newAgency.id,
        max_users: 3,
        max_leads: 100,
        max_clients: 20,
        max_recurring_clients: 10,
        storage_mb: 1024,
        features: {
          // Core features - ALL enabled in trial
          ai_agents: true,
          funil_tarefas: true,
          funil_avancado: true,
          automacoes: true,
          dashboard_principal: true,
          dashboard_financeiro: true,
          comissoes: true,
          suporte_email: true,

          // BLOCKED in trial (PRO features)
          exportacao: false,
          relatorios_agencia: false,
          assinatura_digital: false,
          api_access: false,

          // Trial flag
          is_trial: true,
        },
      },
      { onConflict: "agency_id" }
    );

    if (limitsError) {
      console.error("Agency limits upsert error:", limitsError);
      await rollback(`Erro ao configurar limites do teste: ${limitsError.message}`);
    }

    // Initialize usage
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
      console.error("Agency usage upsert error:", usageError);
      await rollback(`Erro ao inicializar uso da agência: ${usageError.message}`);
    }

    // Create onboarding status (best-effort)
    const { error: onboardingError } = await supabaseClient.from("agency_onboarding_status").insert({
      agency_id: newAgency.id,
      completed_steps: [],
    });

    if (onboardingError) {
      console.warn("Onboarding status insert failed (non-blocking):", onboardingError);
    }

    // Audit log (best-effort)
    try {
      await supabaseClient.from("audit_log").insert({
        action_type: "register_agency",
        entity_type: "agency",
        entity_id: newAgency.id,
        entity_name: newAgency.name,
        agency_id: newAgency.id,
        user_id: userId,
        user_name: ownerName,
        metadata: {
          owner_email: ownerEmail.toLowerCase(),
          source: "auto-register-agency",
        },
      });
    } catch (e) {
      console.warn("Failed to write audit log:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      agencyId: newAgency.id,
      email: ownerEmail.toLowerCase(),
      trialEndsAt: trialEndDate.toISOString(),
      message: "Conta criada com sucesso! Você tem 14 dias de teste grátis.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in auto-register:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
