// Public health-check endpoint
// verify_jwt = false (configured in supabase/config.toml)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const VERSION = "1.0.0";

// In-memory rate limit: 60 req/min per IP
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT) return false;
  b.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRate(ip)) {
    return new Response(
      JSON.stringify({ status: "rate_limited", error: "Too many requests" }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const startedAt = Date.now();
  let dbLatencyMs: number | null = null;
  let status: "ok" | "degraded" | "down" = "ok";

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
        Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const t0 = Date.now();
    const { error } = await supabase
      .from("plans")
      .select("id", { count: "exact", head: true })
      .limit(1);
    dbLatencyMs = Date.now() - t0;
    if (error) status = "degraded";
    else if (dbLatencyMs > 1500) status = "degraded";
  } catch (_err) {
    status = "down";
  }

  return new Response(
    JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      db_latency_ms: dbLatencyMs,
      version: VERSION,
      uptime_check_ms: Date.now() - startedAt,
    }),
    {
      status: status === "down" ? 503 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
