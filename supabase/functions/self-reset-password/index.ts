import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SelfResetRequest {
  email: string;
  full_name: string;
  agency_name: string;
  new_password: string;
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity percentage (0-100)
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();
  
  if (normalizedA === normalizedB) return 100;
  
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(normalizedA, normalizedB);
  return Math.round((1 - distance / maxLen) * 100);
}

// Password validation: min 8 chars
function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, full_name, agency_name, new_password } = (await req.json()) as SelfResetRequest;

    // Validate required fields
    if (!email || !full_name || !agency_name || !new_password) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (!isStrongPassword(new_password)) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw userError;
    }

    const matchingUser = userData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    );

    if (!matchingUser) {
      console.log(`No user found with email: ${email}`);
      return new Response(
        JSON.stringify({ error: "E-mail não encontrado no sistema" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile and agency
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", matchingUser.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's agency
    const { data: agencyMember, error: memberError } = await supabaseAdmin
      .from("agency_members")
      .select("agency_id, agencies(name)")
      .eq("user_id", matchingUser.id)
      .single();

    if (memberError || !agencyMember) {
      console.error("Error fetching agency member:", memberError);
      return new Response(
        JSON.stringify({ error: "Usuário não vinculado a nenhuma agência" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storedName = profile.full_name || "";
    const storedAgencyName = (agencyMember.agencies as any)?.name || "";

    // Calculate similarity
    const nameSimilarity = similarity(full_name, storedName);
    const agencySimilarity = similarity(agency_name, storedAgencyName);

    console.log(`Name similarity: ${nameSimilarity}% (input: "${full_name}", stored: "${storedName}")`);
    console.log(`Agency similarity: ${agencySimilarity}% (input: "${agency_name}", stored: "${storedAgencyName}")`);

    const MIN_SIMILARITY = 60; // 60% minimum match

    if (nameSimilarity < MIN_SIMILARITY) {
      return new Response(
        JSON.stringify({ 
          error: "Nome não corresponde ao cadastro",
          debug: { nameSimilarity }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (agencySimilarity < MIN_SIMILARITY) {
      return new Response(
        JSON.stringify({ 
          error: "Nome da agência não corresponde ao cadastro",
          debug: { agencySimilarity }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All validations passed - reset password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchingUser.id, {
      password: new_password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    console.log(`Password reset successfully for user: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha alterada com sucesso! Faça login com a nova senha."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Self reset password error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
