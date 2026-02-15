import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

interface Lead {
  id: string;
  agency_id: string;
  company_name: string;
  contact_name: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  main_category: string | null;
  pipeline_stage: string;
  temperature: string;
  status: string;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  is_duplicate: boolean;
  duplicate_of: string | null;
}

interface DuplicateGroup {
  key: string;
  matchType: 'email' | 'phone' | 'name_city';
  leads: Lead[];
}

// Normaliza texto para comparação (remove acentos, espaços, pontuação)
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Normaliza telefone (mantém apenas dígitos)
function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Calcula score de completude do lead
function calculateCompleteness(lead: Lead): number {
  let score = 0;
  if (lead.company_name) score += 2;
  if (lead.contact_name) score += 1;
  if (lead.whatsapp) score += 2;
  if (lead.email) score += 2;
  if (lead.city) score += 1;
  if (lead.main_category) score += 1;
  if (lead.estimated_value) score += 1;
  if (lead.notes) score += 1;
  return score;
}

// Escolhe o melhor lead para manter (mais completo, mais ativo)
function selectBestLead(leads: Lead[]): Lead {
  return leads.sort((a, b) => {
    // 1. Mais campos preenchidos
    const completenessA = calculateCompleteness(a);
    const completenessB = calculateCompleteness(b);
    if (completenessA !== completenessB) return completenessB - completenessA;
    
    // 2. Mais ativo recentemente
    const activityA = new Date(a.last_activity_at || a.updated_at).getTime();
    const activityB = new Date(b.last_activity_at || b.updated_at).getTime();
    if (activityA !== activityB) return activityB - activityA;
    
    // 3. Mais antigo (prioridade por ser o original)
    const createdA = new Date(a.created_at).getTime();
    const createdB = new Date(b.created_at).getTime();
    return createdA - createdB;
  })[0];
}

// Mescla dados de leads duplicados para o lead principal
function mergeLeadData(primary: Lead, duplicates: Lead[]): Partial<Lead> {
  const merged: Partial<Lead> = {};
  
  // Para cada campo, usa o valor do lead que tem o dado
  for (const dup of duplicates) {
    if (!primary.contact_name && dup.contact_name) merged.contact_name = dup.contact_name;
    if (!primary.whatsapp && dup.whatsapp) merged.whatsapp = dup.whatsapp;
    if (!primary.email && dup.email) merged.email = dup.email;
    if (!primary.city && dup.city) merged.city = dup.city;
    if (!primary.main_category && dup.main_category) merged.main_category = dup.main_category;
    if (!primary.estimated_value && dup.estimated_value) merged.estimated_value = dup.estimated_value;
    
    // Consolida notas
    if (dup.notes && dup.notes !== primary.notes) {
      merged.notes = (primary.notes || '') + '\n\n---\n[Unificado de lead duplicado]\n' + dup.notes;
    }
  }
  
  return merged;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agencyId, manualRun, userId, userName } = await req.json();

    console.log(`[unify-leads] Starting for agency: ${agencyId}, manual: ${manualRun}`);

    // Buscar todos os leads ativos da agência
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('agency_id', agencyId)
      .neq('status', 'lost')
      .is('merged_at', null)
      .order('created_at', { ascending: true });

    if (leadsError) {
      console.error('[unify-leads] Error fetching leads:', leadsError);
      throw leadsError;
    }

    if (!leads || leads.length === 0) {
      console.log('[unify-leads] No leads found');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum lead encontrado', unified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[unify-leads] Found ${leads.length} leads to analyze`);

    // Agrupar por chaves de duplicidade
    const emailGroups = new Map<string, Lead[]>();
    const phoneGroups = new Map<string, Lead[]>();
    const nameCityGroups = new Map<string, Lead[]>();

    for (const lead of leads) {
      // Grupo por email
      if (lead.email) {
        const normalizedEmail = lead.email.toLowerCase().trim();
        if (!emailGroups.has(normalizedEmail)) {
          emailGroups.set(normalizedEmail, []);
        }
        emailGroups.get(normalizedEmail)!.push(lead);
      }

      // Grupo por telefone
      if (lead.whatsapp) {
        const normalizedPhone = normalizePhone(lead.whatsapp);
        if (normalizedPhone.length >= 10) {
          if (!phoneGroups.has(normalizedPhone)) {
            phoneGroups.set(normalizedPhone, []);
          }
          phoneGroups.get(normalizedPhone)!.push(lead);
        }
      }

      // Grupo por nome + cidade
      if (lead.company_name && lead.city) {
        const key = normalizeText(lead.company_name) + '_' + normalizeText(lead.city);
        if (!nameCityGroups.has(key)) {
          nameCityGroups.set(key, []);
        }
        nameCityGroups.get(key)!.push(lead);
      }
    }

    // Identificar grupos com duplicatas
    const duplicateGroups: DuplicateGroup[] = [];
    const processedLeadIds = new Set<string>();

    // Processar grupos de email
    for (const [key, group] of emailGroups) {
      if (group.length > 1) {
        const unprocessed = group.filter(l => !processedLeadIds.has(l.id));
        if (unprocessed.length > 1) {
          duplicateGroups.push({ key, matchType: 'email', leads: unprocessed });
          unprocessed.forEach(l => processedLeadIds.add(l.id));
        }
      }
    }

    // Processar grupos de telefone
    for (const [key, group] of phoneGroups) {
      if (group.length > 1) {
        const unprocessed = group.filter(l => !processedLeadIds.has(l.id));
        if (unprocessed.length > 1) {
          duplicateGroups.push({ key, matchType: 'phone', leads: unprocessed });
          unprocessed.forEach(l => processedLeadIds.add(l.id));
        }
      }
    }

    // Processar grupos de nome+cidade
    for (const [key, group] of nameCityGroups) {
      if (group.length > 1) {
        const unprocessed = group.filter(l => !processedLeadIds.has(l.id));
        if (unprocessed.length > 1) {
          duplicateGroups.push({ key, matchType: 'name_city', leads: unprocessed });
          unprocessed.forEach(l => processedLeadIds.add(l.id));
        }
      }
    }

    console.log(`[unify-leads] Found ${duplicateGroups.length} duplicate groups`);

    if (duplicateGroups.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma duplicata encontrada', unified: 0, detected: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let unifiedCount = 0;
    const logs: any[] = [];

    // Processar cada grupo de duplicatas
    for (const group of duplicateGroups) {
      const bestLead = selectBestLead(group.leads);
      const duplicates = group.leads.filter(l => l.id !== bestLead.id);
      const mergedData = mergeLeadData(bestLead, duplicates);

      console.log(`[unify-leads] Unifying group: ${group.key} (${group.matchType}) - keeping ${bestLead.id}, merging ${duplicates.length} duplicates`);

      // Atualizar lead principal com dados mesclados
      if (Object.keys(mergedData).length > 0) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            ...mergedData,
            merged_from: duplicates.map(d => d.id),
            updated_at: new Date().toISOString()
          })
          .eq('id', bestLead.id);

        if (updateError) {
          console.error('[unify-leads] Error updating lead:', updateError);
        }
      }

      // Marcar duplicatas
      for (const dup of duplicates) {
        const { error: markError } = await supabase
          .from('leads')
          .update({
            is_duplicate: true,
            duplicate_of: bestLead.id,
            merged_at: new Date().toISOString(),
            status: 'lost'
          })
          .eq('id', dup.id);

        if (markError) {
          console.error('[unify-leads] Error marking duplicate:', markError);
        }

        // Mover atividades para o lead principal
        await supabase
          .from('lead_activities')
          .update({ lead_id: bestLead.id })
          .eq('lead_id', dup.id);

        // Registrar log
        logs.push({
          agency_id: agencyId,
          original_lead_id: dup.id,
          merged_lead_id: bestLead.id,
          action_type: 'merged',
          match_type: group.matchType,
          similarity_score: 1.00,
          details: {
            original_name: dup.company_name,
            merged_into_name: bestLead.company_name,
            match_key: group.key
          },
          executed_by: userId || null,
          executed_by_name: userName || 'Sistema Automático',
          is_automatic: !manualRun
        });

        unifiedCount++;
      }
    }

    // Inserir logs
    if (logs.length > 0) {
      const { error: logError } = await supabase
        .from('lead_unification_logs')
        .insert(logs);

      if (logError) {
        console.error('[unify-leads] Error inserting logs:', logError);
      }
    }

    console.log(`[unify-leads] Completed: unified ${unifiedCount} leads`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${unifiedCount} leads unificados com sucesso`,
        unified: unifiedCount,
        detected: duplicateGroups.length,
        groups: duplicateGroups.map(g => ({
          matchType: g.matchType,
          key: g.key,
          count: g.leads.length
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[unify-leads] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
