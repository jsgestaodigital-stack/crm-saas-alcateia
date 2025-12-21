import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Determine owner name
    let finalOwnerName = ownerName;
    if (!finalOwnerName && registrationId) {
      const { data: regData } = await supabaseClient
        .from("pending_registrations")
        .select("owner_name")
        .eq("id", registrationId)
        .single();
      finalOwnerName = regData?.owner_name;
    }
    if (!finalOwnerName) {
      finalOwnerName = email.split("@")[0];
    }

    // Generate password if not provided
    const finalPassword = password || Math.random().toString(36).slice(-10) + "A1!";

    // Determine agency ID (use existing or create new)
    let finalAgencyId = agencyId;
    let agencyCreated = false;

    if (!finalAgencyId && agencyName && agencySlug) {
      // Create new agency
      const { data: existingAgency } = await supabaseClient
        .from("agencies")
        .select("id")
        .eq("slug", agencySlug)
        .single();

      if (existingAgency) {
        throw new Error("Agency slug already exists");
      }

      const { data: newAgency, error: agencyError } = await supabaseClient
        .from("agencies")
        .insert({
          name: agencyName,
          slug: agencySlug,
          status: "active",
        })
        .select()
        .single();

      if (agencyError) {
        throw new Error(`Failed to create agency: ${agencyError.message}`);
      }

      finalAgencyId = newAgency.id;
      agencyCreated = true;
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
      
      // Add to agency as owner
      await supabaseClient.from("agency_members").upsert({
        agency_id: finalAgencyId,
        user_id: userId,
        role: "owner",
      }, { onConflict: "agency_id,user_id" });

      // Update profile current_agency
      await supabaseClient.from("profiles").update({
        current_agency_id: finalAgencyId,
      }).eq("id", userId);
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password: finalPassword,
        email_confirm: true,
        user_metadata: { full_name: finalOwnerName },
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
        status: "active",
      }, { onConflict: "id" });

      // Add as agency owner
      await supabaseClient.from("agency_members").insert({
        agency_id: finalAgencyId,
        user_id: userId,
        role: "owner",
      });
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
      agency_id: finalAgencyId,
      is_sales: true,
      is_ops: true,
      is_admin: true,
      is_finance: true,
      is_recurring: true,
    }, { onConflict: "user_id,agency_id" });

    // Create agency limits if agency was just created
    if (agencyCreated) {
      await supabaseClient.from("agency_limits").upsert({
        agency_id: finalAgencyId,
        max_users: 10,
        max_leads: 500,
        max_clients: 100,
        max_recurring_clients: 50,
        storage_mb: 5120,
        features: { ai_agents: true, exports: true, api_access: false },
      }, { onConflict: "agency_id" });

      await supabaseClient.from("agency_usage").upsert({
        agency_id: finalAgencyId,
        current_users: 1,
        current_leads: 0,
        current_clients: 0,
        current_recurring_clients: 0,
        storage_used_mb: 0,
      }, { onConflict: "agency_id" });
    }

    // Log the action
    await supabaseClient.from("super_admin_actions").insert({
      super_admin_user_id: userData.user.id,
      super_admin_name: callerProfile?.full_name || "Super Admin",
      agency_id: finalAgencyId,
      agency_name: agencyName || null,
      action: agencyCreated ? "create_agency" : "create_agency_owner",
      metadata: {
        owner_email: email,
        owner_name: finalOwnerName,
        registration_id: registrationId || null,
        user_created: userCreated,
        agency_created: agencyCreated,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      userId,
      agencyId: finalAgencyId,
      email,
      password: userCreated ? finalPassword : undefined,
      userCreated,
      agencyCreated,
      message: agencyCreated 
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
