import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "operador" | "visualizador";
}

// Password validation: min 8 chars
function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're logged in
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callerUser) {
      console.log("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is admin using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdminData, error: isAdminError } = await supabaseAdmin.rpc("is_admin", {
      _user_id: callerUser.id,
    });

    if (isAdminError || !isAdminData) {
      console.log("Admin check failed:", isAdminError);
      return new Response(
        JSON.stringify({ error: "Only admins can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request
    const { email, password, full_name, role } = (await req.json()) as CreateUserRequest;

    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "E-mail inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!full_name || full_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Nome deve ter pelo menos 2 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Senha é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isStrongPassword(password)) {
      return new Response(
        JSON.stringify({ 
          error: "Senha fraca. Deve ter no mínimo 8 caracteres, incluir pelo menos 1 número e 1 símbolo (!@#$%^&*)" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Roles válidos para criação de usuários via admin
    const assignableRoles = ["admin", "operador", "visualizador"];
    if (!role || !assignableRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Nível de acesso inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating user: ${email} with role: ${role} by admin: ${callerUser.email}`);

    // Create user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: full_name.trim() },
    });

    if (createError) {
      console.log("Create user error:", createError);
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este e-mail já está cadastrado" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = newUser.user!.id;

    // Create/update profile (trigger should handle this, but let's ensure)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: full_name.trim(),
          status: "ativo",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.log("Profile error:", profileError);
      // Non-fatal, trigger might have created it
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError) {
      console.log("Role error:", roleError);
      // Try to clean up if role creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Erro ao atribuir nível de acesso");
    }

    // Create user permissions with defaults based on role
    const permissions = {
      user_id: userId,
      can_admin: role === "admin",
      can_sales: role === "admin" || role === "operador",
      can_ops: role === "admin" || role === "operador",
      can_finance: role === "admin",
    };

    const { error: permError } = await supabaseAdmin
      .from("user_permissions")
      .upsert(permissions, { onConflict: "user_id" });

    if (permError) {
      console.log("Permissions error (non-fatal):", permError);
    }

    console.log(`User created successfully: ${email} (${userId})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          email: newUser.user!.email,
          full_name: full_name.trim(),
          role,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create user error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
