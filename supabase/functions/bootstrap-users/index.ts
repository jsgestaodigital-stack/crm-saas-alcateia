import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionUser {
  email: string;
  password: string;
  full_name: string;
  role?: "admin" | "operador" | "visualizador";
  permissions?: {
    can_sales?: boolean;
    can_ops?: boolean;
    can_admin?: boolean;
    can_finance?: boolean;
  };
}

const ALLOWED_EMAILS = new Set([
  "amandasousawebmedia@gmail.com",
  "jsgestaodigital@gmail.com",
  "rankeialtda@gmail.com",
]);

// Strong password validation: min 8 chars, at least 1 number, 1 symbol
function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/\d/.test(password)) return false; // at least one number
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password)) return false; // at least one symbol
  return true;
}

function validateUsers(users: ProvisionUser[]) {
  if (!Array.isArray(users) || users.length < 1 || users.length > 3) {
    return { valid: false, error: "Expected 1-3 users" };
  }

  const emails = users.map((u) => (u?.email ?? "").toLowerCase().trim());
  if (new Set(emails).size !== emails.length) {
    return { valid: false, error: "Duplicate emails found" };
  }

  for (const email of emails) {
    if (!ALLOWED_EMAILS.has(email)) {
      return { valid: false, error: `Email not allowed: ${email}` };
    }
  }

  for (const u of users) {
    if (!u.full_name || typeof u.full_name !== "string") {
      return { valid: false, error: "Missing or invalid full_name" };
    }
    if (!u.password || typeof u.password !== "string") {
      return { valid: false, error: "Missing password" };
    }
    if (!isStrongPassword(u.password)) {
      return { 
        valid: false, 
        error: `Senha fraca para ${u.email}. A senha deve ter no mínimo 8 caracteres, incluir pelo menos 1 número e 1 símbolo.` 
      };
    }
    // Validate role if provided
    if (u.role && !["admin", "operador", "visualizador"].includes(u.role)) {
      return { valid: false, error: `Invalid role for ${u.email}: ${u.role}` };
    }
  }

  return { valid: true, error: null };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Require bootstrap token to prevent unauthorized access
    const bootstrapToken = Deno.env.get("BOOTSTRAP_TOKEN");
    const providedToken = req.headers.get("X-Bootstrap-Token");
    
    if (!bootstrapToken) {
      console.log("BOOTSTRAP_TOKEN not configured - endpoint disabled for security");
      return new Response(
        JSON.stringify({
          error: "Bootstrap endpoint is disabled. Configure BOOTSTRAP_TOKEN to enable.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!providedToken || providedToken !== bootstrapToken) {
      console.log("Invalid or missing bootstrap token attempt");
      return new Response(
        JSON.stringify({
          error: "Invalid or missing bootstrap token. Access denied.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { users } = (await req.json()) as { users: ProvisionUser[] };

    const validation = validateUsers(users);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.error || "Invalid payload. This endpoint only provisions the initial admin accounts for this project.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // If there are already users outside the allowed set, block to avoid misuse.
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) throw listError;

    const existingEmails = new Set(
      (existingUsers?.users ?? [])
        .map((u) => (u.email ?? "").toLowerCase())
        .filter(Boolean)
    );

    for (const email of existingEmails) {
      if (!ALLOWED_EMAILS.has(email)) {
        return new Response(
          JSON.stringify({
            error:
              "Project already initialized with other users. This endpoint is disabled for safety.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const u of users) {
      const email = u.email.toLowerCase().trim();
      const role = u.role || "admin"; // Default to admin if not specified

      try {
        const existing = (existingUsers?.users ?? []).find(
          (x) => (x.email ?? "").toLowerCase() === email
        );

        let userId: string;

        if (existing) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existing.id,
            { password: u.password, email_confirm: true, user_metadata: { full_name: u.full_name } }
          );
          if (updateError) throw updateError;
          userId = existing.id;
        } else {
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.full_name },
          });
          if (createError) throw createError;
          userId = created.user!.id;
        }

        // Ensure profile exists/updated
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name: u.full_name,
              status: "ativo",
            },
            { onConflict: "id" }
          );
        if (profileError) throw profileError;

        // Ensure a single role row - delete existing and insert new
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (roleError) throw roleError;

        // Set permissions based on role or custom permissions
        let permissions = {
          user_id: userId,
          can_admin: role === "admin",
          can_sales: role === "admin",
          can_ops: role === "admin" || role === "operador",
          can_finance: role === "admin",
        };

        // Override with custom permissions if provided
        if (u.permissions) {
          permissions = {
            ...permissions,
            can_admin: u.permissions.can_admin ?? permissions.can_admin,
            can_sales: u.permissions.can_sales ?? permissions.can_sales,
            can_ops: u.permissions.can_ops ?? permissions.can_ops,
            can_finance: u.permissions.can_finance ?? permissions.can_finance,
          };
        }

        const { error: permError } = await supabaseAdmin
          .from("user_permissions")
          .upsert(permissions, { onConflict: "user_id" });
        
        if (permError) {
          console.log("Permissions error (non-fatal):", permError);
        }

        console.log(`User provisioned: ${email} with role: ${role}`);
        results.push({ email, success: true });
      } catch (err) {
        console.error(`Error provisioning ${email}:`, err);
        results.push({ email, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Bootstrap error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
