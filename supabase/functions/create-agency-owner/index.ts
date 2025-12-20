import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOwnerRequest {
  agencyId: string;
  email: string;
  password: string;
  registrationId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Verify caller is super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");

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

    // Parse request body
    const body: CreateOwnerRequest = await req.json();
    const { agencyId, email, password, registrationId } = body;

    if (!agencyId || !email || !password) {
      throw new Error("Missing required fields: agencyId, email, password");
    }

    // Get registration data for owner name
    const { data: regData } = await supabaseClient
      .from("pending_registrations")
      .select("owner_name")
      .eq("id", registrationId)
      .single();

    const ownerName = regData?.owner_name || email.split("@")[0];

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
      },
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes("already been registered")) {
        // Get existing user
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === email.toLowerCase());
        
        if (existingUser) {
          // Add to agency as owner
          await supabaseClient.from("agency_members").upsert({
            agency_id: agencyId,
            user_id: existingUser.id,
            role: "owner",
          }, { onConflict: "agency_id,user_id" });

          // Update profile current_agency
          await supabaseClient.from("profiles").update({
            current_agency_id: agencyId,
          }).eq("id", existingUser.id);

          return new Response(JSON.stringify({
            success: true,
            message: "Existing user added as agency owner",
            userId: existingUser.id,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Upsert profile
    await supabaseClient.from("profiles").upsert({
      id: userId,
      full_name: ownerName,
      current_agency_id: agencyId,
      status: "ativo",
    }, { onConflict: "id" });

    // Add as agency owner
    await supabaseClient.from("agency_members").insert({
      agency_id: agencyId,
      user_id: userId,
      role: "owner",
    });

    // Set user role as admin
    await supabaseClient.from("user_roles").upsert({
      user_id: userId,
      role: "admin",
    }, { onConflict: "user_id" });

    // Set permissions (full access for owner)
    await supabaseClient.from("user_permissions").upsert({
      user_id: userId,
      can_sales: true,
      can_ops: true,
      can_admin: true,
      can_finance: true,
      can_recurring: true,
      is_super_admin: false,
    }, { onConflict: "user_id" });

    // Log the action
    await supabaseClient.from("super_admin_actions").insert({
      super_admin_user_id: userData.user.id,
      agency_id: agencyId,
      action: "create_agency_owner",
      metadata: {
        owner_email: email,
        owner_name: ownerName,
        registration_id: registrationId,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: "Agency owner created successfully",
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
