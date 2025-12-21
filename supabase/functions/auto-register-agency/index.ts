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

    // Validate password strength
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if agency slug already exists
    const { data: existingAgency } = await supabaseClient
      .from("agencies")
      .select("id")
      .eq("slug", agencySlug)
      .single();

    if (existingAgency) {
      throw new Error("Uma agência com esse nome já existe. Tente outro nome.");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === ownerEmail.toLowerCase());

    if (existingUser) {
      throw new Error("Este email já está cadastrado. Faça login ou use outro email.");
    }

    // Create agency with trial status
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days trial

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

    // Create profile
    const { error: profileError } = await supabaseClient.from("profiles").upsert({
      id: userId,
      full_name: ownerName,
      current_agency_id: newAgency.id,
      status: "active",
      phone: ownerPhone || null,
    }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Add as agency owner
    await supabaseClient.from("agency_members").insert({
      agency_id: newAgency.id,
      user_id: userId,
      role: "owner",
    });

    // Set user role as admin
    await supabaseClient.from("user_roles").upsert({
      user_id: userId,
      agency_id: newAgency.id,
      role: "admin",
    }, { onConflict: "user_id,agency_id" });

    // Set full permissions for owner
    await supabaseClient.from("user_permissions").upsert({
      user_id: userId,
      agency_id: newAgency.id,
      is_sales: true,
      is_ops: true,
      is_admin: true,
      is_finance: true,
      is_recurring: true,
    }, { onConflict: "user_id,agency_id" });

    // Create trial limits (more generous for trial)
    await supabaseClient.from("agency_limits").upsert({
      agency_id: newAgency.id,
      max_users: 3,
      max_leads: 100,
      max_clients: 20,
      max_recurring_clients: 10,
      storage_mb: 1024,
      features: { 
        ai_agents: true, 
        exports: true, 
        api_access: false,
        is_trial: true,
      },
    }, { onConflict: "agency_id" });

    // Initialize usage
    await supabaseClient.from("agency_usage").upsert({
      agency_id: newAgency.id,
      current_users: 1,
      current_leads: 0,
      current_clients: 0,
      current_recurring_clients: 0,
      storage_used_mb: 0,
    }, { onConflict: "agency_id" });

    // Create onboarding status
    await supabaseClient.from("agency_onboarding_status").insert({
      agency_id: newAgency.id,
      completed_steps: [],
    });

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
