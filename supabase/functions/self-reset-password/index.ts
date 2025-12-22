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

// Check if input name matches stored name (flexible matching)
function nameMatches(inputName: string, storedName: string): { matches: boolean; similarity: number } {
  const input = inputName.toLowerCase().trim();
  const stored = storedName.toLowerCase().trim();
  
  // Exact match
  if (input === stored) {
    return { matches: true, similarity: 100 };
  }
  
  // Check if input is first name of stored
  const storedParts = stored.split(/\s+/);
  const inputParts = input.split(/\s+/);
  
  // If user typed just first name and it matches stored first name
  if (inputParts.length === 1 && storedParts.length > 0) {
    const firstNameSimilarity = similarity(input, storedParts[0]);
    if (firstNameSimilarity >= 80) {
      return { matches: true, similarity: firstNameSimilarity };
    }
  }
  
  // If user typed multiple names, check first and last
  if (inputParts.length >= 2 && storedParts.length >= 2) {
    const firstMatch = similarity(inputParts[0], storedParts[0]) >= 80;
    const lastMatch = similarity(inputParts[inputParts.length - 1], storedParts[storedParts.length - 1]) >= 80;
    if (firstMatch && lastMatch) {
      return { matches: true, similarity: 90 };
    }
  }
  
  // Full string similarity
  const fullSimilarity = similarity(input, stored);
  return { 
    matches: fullSimilarity >= 50, // Lowered from 60 to 50 for more tolerance
    similarity: fullSimilarity 
  };
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

    let requestBody: SelfResetRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Formato de requisição inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, full_name, agency_name, new_password } = requestBody;

    console.log("=== Self Reset Password Request ===");
    console.log(`Email: ${email}`);
    console.log(`Name provided: ${full_name}`);
    console.log(`Agency provided: ${agency_name}`);

    // Validate required fields
    if (!email || !full_name || !agency_name || !new_password) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (!isStrongPassword(new_password)) {
      console.error("Password too weak");
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
      console.error(`No user found with email: ${email}`);
      return new Response(
        JSON.stringify({ error: "E-mail não encontrado no sistema. Verifique se digitou corretamente." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User found: ${matchingUser.id}`);

    // Get user's profile and agency
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", matchingUser.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado. Entre em contato com o suporte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      console.error("Profile is null for user:", matchingUser.id);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado. Entre em contato com o suporte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Profile found: ${profile.full_name}`);

    // Get user's agency
    const { data: agencyMember, error: memberError } = await supabaseAdmin
      .from("agency_members")
      .select("agency_id, agencies(name)")
      .eq("user_id", matchingUser.id)
      .single();

    if (memberError) {
      console.error("Error fetching agency member:", memberError);
      return new Response(
        JSON.stringify({ error: "Usuário não vinculado a nenhuma agência. Entre em contato com o suporte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!agencyMember) {
      console.error("No agency member found for user:", matchingUser.id);
      return new Response(
        JSON.stringify({ error: "Usuário não vinculado a nenhuma agência. Entre em contato com o suporte." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storedName = profile.full_name || "";
    const storedAgencyName = (agencyMember.agencies as any)?.name || "";

    console.log(`Stored name: "${storedName}"`);
    console.log(`Stored agency: "${storedAgencyName}"`);

    // Check name match with flexible matching
    const nameCheck = nameMatches(full_name, storedName);
    console.log(`Name check: matches=${nameCheck.matches}, similarity=${nameCheck.similarity}%`);

    // Check agency match
    const agencySimilarity = similarity(agency_name, storedAgencyName);
    console.log(`Agency similarity: ${agencySimilarity}%`);

    const MIN_AGENCY_SIMILARITY = 50; // Lowered for more tolerance

    if (!nameCheck.matches) {
      console.error(`Name mismatch: "${full_name}" vs "${storedName}" (${nameCheck.similarity}%)`);
      return new Response(
        JSON.stringify({ 
          error: "Nome não corresponde ao cadastro. Digite seu nome completo conforme cadastrado.",
          hint: `Dica: seu nome começa com "${storedName.split(' ')[0]}"`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (agencySimilarity < MIN_AGENCY_SIMILARITY) {
      console.error(`Agency mismatch: "${agency_name}" vs "${storedAgencyName}" (${agencySimilarity}%)`);
      return new Response(
        JSON.stringify({ 
          error: "Nome da agência não corresponde ao cadastro. Verifique o nome correto da sua agência."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All validations passed - reset password
    console.log("All validations passed, updating password...");
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchingUser.id, {
      password: new_password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    // Update password_changed_at in profile
    await supabaseAdmin
      .from("profiles")
      .update({ password_changed_at: new Date().toISOString() })
      .eq("id", matchingUser.id);

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
      JSON.stringify({ error: "Erro interno do servidor. Tente novamente em alguns instantes." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
