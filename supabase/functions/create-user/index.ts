import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "operador" | "visualizador";
}

const VALID_ROLES = ["admin", "operador", "visualizador"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInput(data: unknown): { valid: true; data: CreateUserInput } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Validate email
  if (!input.email || typeof input.email !== 'string') {
    return { valid: false, error: 'E-mail é obrigatório' };
  }
  if (!EMAIL_REGEX.test(input.email)) {
    return { valid: false, error: 'E-mail inválido' };
  }
  if (input.email.length > 255) {
    return { valid: false, error: 'E-mail muito longo' };
  }

  // Validate full_name
  if (!input.full_name || typeof input.full_name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  if (input.full_name.trim().length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  if (input.full_name.length > 200) {
    return { valid: false, error: 'Nome muito longo' };
  }

  // Validate password
  if (!input.password || typeof input.password !== 'string') {
    return { valid: false, error: 'Senha é obrigatória' };
  }
  if (input.password.length < 8) {
    return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  }
  if (input.password.length > 128) {
    return { valid: false, error: 'Senha muito longa' };
  }

  // Validate role
  if (!input.role || typeof input.role !== 'string') {
    return { valid: false, error: 'Nível de acesso é obrigatório' };
  }
  if (!VALID_ROLES.includes(input.role)) {
    return { valid: false, error: 'Nível de acesso inválido' };
  }

  return {
    valid: true,
    data: {
      email: input.email.toLowerCase().trim(),
      password: input.password,
      full_name: input.full_name.trim(),
      role: input.role as CreateUserInput['role'],
    }
  };
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
        JSON.stringify({ error: "Autenticação necessária" }),
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
      console.log("[create-user] Auth error");
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
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
      console.log("[create-user] Admin check failed");
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's agency_id
    const { data: callerProfile, error: profileFetchError } = await supabaseAdmin
      .from("profiles")
      .select("current_agency_id")
      .eq("id", callerUser.id)
      .single();

    let callerAgencyId = callerProfile?.current_agency_id;

    // Fallback: get from agency_members if not set in profile
    if (!callerAgencyId) {
      const { data: membership } = await supabaseAdmin
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", callerUser.id)
        .limit(1)
        .single();
      callerAgencyId = membership?.agency_id;
    }

    if (!callerAgencyId) {
      console.log("[create-user] Caller has no agency");
      return new Response(
        JSON.stringify({ error: "Você não está associado a nenhuma agência" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-user] Caller agency: ${callerAgencyId}`);

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, full_name, role } = validation.data;

    console.log(`[create-user] Creating user: ${email} with role: ${role} by admin: ${callerUser.email}`);

    // Create user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name },
    });

    if (createError) {
      console.log("[create-user] Create user error");
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este e-mail já está cadastrado" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user!.id;

    // Create/update profile (trigger should handle this, but let's ensure)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name,
          status: "ativo",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.log("[create-user] Profile error (non-fatal)");
      // Non-fatal, trigger might have created it
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError) {
      console.log("[create-user] Role error");
      // Try to clean up if role creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao atribuir nível de acesso. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      console.log("[create-user] Permissions error (non-fatal)");
    }

    // Add user to the caller's agency
    const { error: memberError } = await supabaseAdmin
      .from("agency_members")
      .insert({
        agency_id: callerAgencyId,
        user_id: userId,
        role: role,
      });

    if (memberError) {
      console.log("[create-user] Agency member error:", memberError.message);
      // Try to clean up
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao adicionar usuário à equipe. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set user's current_agency_id in profile
    await supabaseAdmin
      .from("profiles")
      .update({ current_agency_id: callerAgencyId })
      .eq("id", userId);

    console.log(`[create-user] User created successfully: ${email} (${userId})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          email: newUser.user!.email,
          full_name,
          role,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-user] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro inesperado. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
