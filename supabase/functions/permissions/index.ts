import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[permissions] Action: ${action}, User: ${user.id}`);

    // GET /permissions/get - Get user permissions
    if (action === "get" && req.method === "GET") {
      const agencyId = url.searchParams.get("agency_id");
      
      const { data, error } = await supabase.rpc("get_user_permissions", {
        _user_id: user.id,
        _agency_id: agencyId || null,
      });

      if (error) {
        console.error("[permissions] Error getting permissions:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /permissions/check - Check specific permission
    if (action === "check" && req.method === "POST") {
      const body = await req.json();
      const { permission, agency_id } = body;

      if (!permission || !agency_id) {
        return new Response(
          JSON.stringify({ error: "Missing permission or agency_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("is_allowed", {
        _user_id: user.id,
        _agency_id: agency_id,
        _permission: permission,
      });

      if (error) {
        console.error("[permissions] Error checking permission:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ allowed: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /permissions/update-role - Update member role
    if (action === "update-role" && req.method === "POST") {
      const body = await req.json();
      const { target_user_id, new_role, agency_id } = body;

      if (!target_user_id || !new_role) {
        return new Response(
          JSON.stringify({ error: "Missing target_user_id or new_role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("update_member_role", {
        _target_user_id: target_user_id,
        _new_role: new_role,
        _agency_id: agency_id || null,
      });

      if (error) {
        console.error("[permissions] Error updating role:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /permissions/templates - Get role templates
    if (action === "templates" && req.method === "GET") {
      const { data, error } = await supabase
        .from("role_permission_templates")
        .select("*")
        .order("role");

      if (error) {
        console.error("[permissions] Error getting templates:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /permissions/update-template - Update role template (super admin only)
    if (action === "update-template" && req.method === "POST") {
      // Check if user is super admin
      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
        _user_id: user.id,
      });

      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: "Only super admins can update templates" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { role, permissions } = body;

      if (!role || !permissions) {
        return new Response(
          JSON.stringify({ error: "Missing role or permissions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("update_role_template", {
        _role: role,
        _permissions: permissions,
      });

      if (error) {
        console.error("[permissions] Error updating template:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[permissions] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
