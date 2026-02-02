/**
 * Shared CORS configuration for Edge Functions
 * Restricts origins to known domains for better security
 */

// Known safe origins for this application
const ALLOWED_ORIGINS = [
  'https://gbrankcrm.lovable.app',
  'https://id-preview--a3547989-d809-48e1-8acc-4a1f81c0ea2e.lovable.app',
];

// Development origins (only used when ENVIRONMENT=development)
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Gets CORS headers based on the request origin
 * Returns restricted headers for known origins, empty for unknown
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';
  
  const validOrigins = isDev 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS;
  
  // Check if origin is allowed
  const isAllowed = validOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Legacy CORS headers for backwards compatibility
 * Use getCorsHeaders(req) for new functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
