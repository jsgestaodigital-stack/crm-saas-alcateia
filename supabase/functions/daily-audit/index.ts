import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

interface AuditResult {
  run_id: string
  agencies_checked: number
  issues_found: number
  issues_repaired: number
  policy_changes: number
  anomalies_detected: number
  sessions_cleaned: number
  rate_limits_cleaned: number
  duration_ms: number
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔐 Starting daily multi-tenant audit...')

    // 1. Run full agency audit
    const { data: auditRunId, error: auditError } = await supabase
      .rpc('run_full_agency_audit')
    
    if (auditError) {
      console.error('Error running agency audit:', auditError)
      throw auditError
    }

    console.log('✅ Agency audit completed. Run ID:', auditRunId)

    // 2. Detect RLS policy changes
    const { data: policyChanges, error: policyError } = await supabase
      .rpc('detect_rls_policy_changes')
    
    if (policyError) {
      console.error('Error detecting policy changes:', policyError)
    }

    console.log('📋 Policy changes detected:', policyChanges || 0)

    // 3. Run anomaly detection
    const { data: anomaliesDetected, error: anomalyError } = await supabase
      .rpc('run_anomaly_detection')
    
    if (anomalyError) {
      console.error('Error running anomaly detection:', anomalyError)
    }

    console.log('🔍 Anomalies detected:', anomaliesDetected || 0)

    // 4. Cleanup expired sessions
    const { data: sessionsCleaned, error: sessionError } = await supabase
      .rpc('cleanup_expired_sessions')
    
    if (sessionError) {
      console.error('Error cleaning sessions:', sessionError)
    }

    console.log('🧹 Expired sessions cleaned:', sessionsCleaned || 0)

    // 5. Cleanup rate limit events
    const { error: rateLimitError } = await supabase
      .rpc('cleanup_rate_limit_events')
    
    if (rateLimitError) {
      console.error('Error cleaning rate limit events:', rateLimitError)
    }

    // 6. Get audit run details
    const { data: auditRun } = await supabase
      .from('system_audit_runs')
      .select('*')
      .eq('id', auditRunId)
      .single()

    // 7. Check for agencies without owners
    const { data: agenciesWithoutOwner } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        agency_members (
          user_id,
          role
        )
      `)
      .eq('status', 'active')

    const noOwnerAgencies = agenciesWithoutOwner?.filter(agency => {
      const hasOwner = agency.agency_members?.some((m: { role: string }) => m.role === 'owner')
      return !hasOwner
    }) || []

    // Create alerts for agencies without owners
    for (const agency of noOwnerAgencies) {
      await supabase
        .from('super_admin_alerts')
        .insert({
          alert_type: 'agency_health',
          severity: 'critical',
          title: 'Agência sem Owner',
          message: `A agência "${agency.name}" não possui nenhum owner definido`,
          agency_id: agency.id,
          details: { agency_name: agency.name }
        })
    }

    // 8. Check for users with invalid current_agency_id
    const { data: invalidSessions } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        current_agency_id,
        agency_members!inner (
          agency_id
        )
      `)
      .not('current_agency_id', 'is', null)

    const usersWithInvalidAgency = invalidSessions?.filter(ur => {
      const memberOf = ur.agency_members?.map((m: { agency_id: string }) => m.agency_id) || []
      return ur.current_agency_id && !memberOf.includes(ur.current_agency_id)
    }) || []

    // Log security violations for invalid sessions
    for (const user of usersWithInvalidAgency) {
      await supabase
        .from('mt_security_violations')
        .insert({
          violation_type: 'invalid_current_agency',
          user_id: user.user_id,
          attempted_agency_id: user.current_agency_id,
          details: { 
            message: 'User has current_agency_id set to agency they are not a member of',
            detected_by: 'daily_audit'
          },
          severity: 'warning'
        })

      // Force reset current_agency_id to null
      await supabase
        .from('user_roles')
        .update({ current_agency_id: null })
        .eq('user_id', user.user_id)
    }

    const duration = Date.now() - startTime

    const result: AuditResult = {
      run_id: auditRunId,
      agencies_checked: auditRun?.agencies_checked || 0,
      issues_found: (auditRun?.issues_found || 0) + noOwnerAgencies.length + usersWithInvalidAgency.length,
      issues_repaired: (auditRun?.issues_repaired || 0) + usersWithInvalidAgency.length,
      policy_changes: policyChanges || 0,
      anomalies_detected: anomaliesDetected || 0,
      sessions_cleaned: sessionsCleaned || 0,
      rate_limits_cleaned: 0,
      duration_ms: duration
    }

    console.log('🏁 Daily audit completed:', result)

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Daily audit error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
