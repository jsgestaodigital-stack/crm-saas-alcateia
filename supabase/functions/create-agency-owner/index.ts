import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Supports two modes:
// 1. Create owner for existing agency (registrationId + agencyId)
// 2. Create new agency with owner (agencyName + agencySlug + ownerName)
interface CreateOwnerRequest {
  agencyId?: string;
  agencyName?: string;
  agencySlug?: string;
  email: string;
  password?: string;
  ownerName?: string;
  registrationId?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Verify caller is super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey || "");

    // Verify token and check super admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid authentication token");
    }

    const { data: isSuperAdmin } = await supabaseClient.rpc("is_super_admin", { 
      _user_id: userData.user.id 
    });

    if (!isSuperAdmin) {
      throw new Error("Only super admin can create agency owners");
    }

    // Get caller info for audit
    const { data: callerProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", userData.user.id)
      .single();

    // Parse request body
    const body: CreateOwnerRequest = await req.json();
    const { agencyId, agencyName, agencySlug, email, password, ownerName, registrationId } = body;

    if (!email) {
      throw new Error("Missing required field: email");
    }

    console.log(`[create-agency-owner] Processing for email: ${email}, registrationId: ${registrationId}`);

    // Fetch registration data if registrationId provided
    let registrationData: any = null;
    let isAlcateia = false;
    let storedPassword: string | null = null;

    if (registrationId) {
      const { data: regData, error: regError } = await supabaseClient
        .from("pending_registrations")
        .select("*")
        .eq("id", registrationId)
        .single();

      if (regError) {
        console.error("[create-agency-owner] Failed to fetch registration:", regError);
      } else {
        registrationData = regData;
        isAlcateia = regData?.is_alcateia === true;
        storedPassword = regData?.temp_password_hash || null;
        console.log(`[create-agency-owner] Registration data - isAlcateia: ${isAlcateia}`);
      }
    }

    // Determine owner name
    let finalOwnerName = ownerName;
    if (!finalOwnerName && registrationData) {
      finalOwnerName = registrationData.owner_name;
    }
    if (!finalOwnerName) {
      finalOwnerName = email.split("@")[0];
    }

    // Use stored password from registration, or generate one
    const finalPassword = storedPassword || password || Math.random().toString(36).slice(-10) + "A1!";

    // Determine agency ID (use existing or create new)
    let finalAgencyId = agencyId;
    let agencyCreated = false;
    const finalAgencyName = agencyName || registrationData?.agency_name;
    const finalAgencySlug = agencySlug || registrationData?.agency_slug;

    if (!finalAgencyId && finalAgencyName && finalAgencySlug) {
      // Check if slug already exists
      const { data: existingAgency } = await supabaseClient
        .from("agencies")
        .select("id")
        .eq("slug", finalAgencySlug)
        .single();

      if (existingAgency) {
        throw new Error("Agency slug already exists");
      }

      // Create new agency with appropriate status
      const agencyStatus = isAlcateia ? "active" : "trial";
      const agencySettings = isAlcateia 
        ? {
            is_alcateia: true,
            lifetime_access: true,
            alcateia_enrolled_at: new Date().toISOString(),
          }
        : {
            trial_started_at: new Date().toISOString(),
          };

      const { data: newAgency, error: agencyError } = await supabaseClient
        .from("agencies")
        .insert({
          name: finalAgencyName,
          slug: finalAgencySlug,
          status: agencyStatus,
          settings: agencySettings,
        })
        .select()
        .single();

      if (agencyError) {
        throw new Error(`Failed to create agency: ${agencyError.message}`);
      }

      finalAgencyId = newAgency.id;
      agencyCreated = true;
      console.log(`[create-agency-owner] Agency created: ${finalAgencyId}, isAlcateia: ${isAlcateia}`);
    }

    if (!finalAgencyId) {
      throw new Error("Must provide either agencyId or agencyName+agencySlug");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

    let userId: string;
    let userCreated = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[create-agency-owner] User already exists: ${userId}, linking to agency...`);
      
      // Add to agency as owner
      await supabaseClient.from("agency_members").upsert({
        agency_id: finalAgencyId,
        user_id: userId,
        role: "owner",
      }, { onConflict: "agency_id,user_id" });

      // Update profile current_agency AND clear pending_approval flag
      await supabaseClient.from("profiles").update({
        current_agency_id: finalAgencyId,
      }).eq("id", userId);

      // Update user metadata to remove pending_approval flag
      await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: { 
          ...existingUser.user_metadata,
          pending_approval: false,
          approved_at: new Date().toISOString(),
        },
      });

      console.log(`[create-agency-owner] Existing user ${userId} linked to agency ${finalAgencyId}`);
    } else {
      // Create new user (fallback for non-Alcateia or edge cases)
      console.log(`[create-agency-owner] Creating new user for ${email}...`);
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password: finalPassword,
        email_confirm: true,
        user_metadata: { 
          full_name: finalOwnerName,
          is_alcateia: isAlcateia,
        },
      });

      if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      userId = authData.user.id;
      userCreated = true;

      // Create profile
      await supabaseClient.from("profiles").upsert({
        id: userId,
        full_name: finalOwnerName,
        current_agency_id: finalAgencyId,
        status: "ativo",
      }, { onConflict: "id" });

      // Add as agency owner
      await supabaseClient.from("agency_members").insert({
        agency_id: finalAgencyId,
        user_id: userId,
        role: "owner",
      });

      console.log(`[create-agency-owner] New user ${userId} created and linked to agency ${finalAgencyId}`);
    }

    // Set user role as admin for this agency
    await supabaseClient.from("user_roles").upsert({
      user_id: userId,
      agency_id: finalAgencyId,
      role: "admin",
    }, { onConflict: "user_id,agency_id" });

    // Set permissions (full access for owner)
    await supabaseClient.from("user_permissions").upsert({
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
    }, { onConflict: "user_id" });

    // Create subscription if agency was just created
    if (agencyCreated) {
      // Get starter plan
      const { data: starterPlan } = await supabaseClient
        .from("plans")
        .select("id")
        .eq("slug", "starter")
        .eq("active", true)
        .maybeSingle();

      if (starterPlan) {
        const endDate = new Date();
        if (isAlcateia) {
          endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime = 100 years
        } else {
          endDate.setDate(endDate.getDate() + 14); // 14 day trial
        }

        await supabaseClient.from("subscriptions").upsert({
          agency_id: finalAgencyId,
          plan_id: starterPlan.id,
          status: isAlcateia ? "active" : "trial",
          trial_ends_at: isAlcateia ? null : endDate.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          metadata: { 
            source: isAlcateia ? "alcateia-approval" : "manual-approval",
            is_alcateia: isAlcateia,
          },
        }, { onConflict: "agency_id" });

        console.log(`[create-agency-owner] Subscription created - isAlcateia: ${isAlcateia}`);
      }

      // Create agency limits with appropriate values
      await supabaseClient.from("agency_limits").upsert({
        agency_id: finalAgencyId,
        max_users: isAlcateia ? 10 : 3,
        max_leads: isAlcateia ? 1000 : 100,
        max_clients: isAlcateia ? 100 : 20,
        max_recurring_clients: isAlcateia ? 50 : 10,
        storage_mb: isAlcateia ? 5120 : 1024,
        features: {
          ai_agents: true,
          funil_tarefas: true,
          funil_avancado: true,
          automacoes: true,
          dashboard_principal: true,
          dashboard_financeiro: isAlcateia,
          comissoes: true,
          suporte_email: true,
          exportacao: isAlcateia,
          relatorios_agencia: isAlcateia,
          assinatura_digital: isAlcateia,
          api_access: false,
          is_trial: !isAlcateia,
          is_alcateia: isAlcateia,
          lifetime_access: isAlcateia,
        },
      }, { onConflict: "agency_id" });

      await supabaseClient.from("agency_usage").upsert({
        agency_id: finalAgencyId,
        current_users: 1,
        current_leads: 0,
        current_clients: 0,
        current_recurring_clients: 0,
        storage_used_mb: 0,
      }, { onConflict: "agency_id" });

      // Create onboarding status
      try {
        await supabaseClient.from("agency_onboarding_status").insert({
          agency_id: finalAgencyId,
          completed_steps: [],
        });
      } catch (e) {
        console.warn("[create-agency-owner] Onboarding status insert failed (non-blocking):", e);
      }

      console.log(`[create-agency-owner] Agency limits created - isAlcateia: ${isAlcateia}`);
    }

    // Clear temp password from pending_registrations for security
    if (registrationId) {
      await supabaseClient
        .from("pending_registrations")
        .update({ temp_password_hash: null })
        .eq("id", registrationId);
    }

    // Log the action
    await supabaseClient.from("super_admin_actions").insert({
      super_admin_user_id: userData.user.id,
      super_admin_name: callerProfile?.full_name || "Super Admin",
      agency_id: finalAgencyId,
      agency_name: finalAgencyName || null,
      action: agencyCreated ? "create_agency" : "create_agency_owner",
      metadata: {
        owner_email: email,
        owner_name: finalOwnerName,
        registration_id: registrationId || null,
        user_created: userCreated,
        agency_created: agencyCreated,
        is_alcateia: isAlcateia,
      },
    });

    console.log(`[create-agency-owner] Completed successfully for ${email}`);

    return new Response(JSON.stringify({
      success: true,
      userId,
      agencyId: finalAgencyId,
      email,
      password: userCreated ? finalPassword : undefined,
      userCreated,
      agencyCreated,
      isAlcateia,
      message: isAlcateia 
        ? "Membro Alcateia criado com acesso vitalício!" 
        : agencyCreated 
          ? "Agency and owner created successfully" 
          : "Agency owner created successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error creating agency owner:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
