import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DuplicateResult, 
  calculateSimilarity, 
  normalizeForComparison 
} from '@/lib/leadValidation';

interface LeadDuplicateCheck {
  company_name: string;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
}

export function useLeadDuplicates() {
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = useCallback(async (lead: LeadDuplicateCheck): Promise<DuplicateResult[]> => {
    if (!lead.company_name || lead.company_name.length < 2) {
      setDuplicates([]);
      return [];
    }

    setIsChecking(true);
    const results: DuplicateResult[] = [];

    try {
      // Fetch existing leads for comparison
      const { data: existingLeads, error } = await supabase
        .from('leads')
        .select('id, company_name, whatsapp, email, instagram')
        .neq('status', 'lost')
        .limit(500);

      if (error) throw error;

      if (!existingLeads) {
        setDuplicates([]);
        return [];
      }

      const normalizedNewPhone = lead.whatsapp ? lead.whatsapp.replace(/\D/g, '') : null;
      const normalizedNewEmail = lead.email ? lead.email.toLowerCase().trim() : null;
      const normalizedNewInstagram = lead.instagram 
        ? lead.instagram.toLowerCase().replace('@', '').trim() 
        : null;

      for (const existing of existingLeads) {
        // Check phone match
        if (normalizedNewPhone && existing.whatsapp) {
          const existingPhone = existing.whatsapp.replace(/\D/g, '');
          if (normalizedNewPhone === existingPhone) {
            results.push({
              id: existing.id,
              company_name: existing.company_name,
              whatsapp: existing.whatsapp,
              email: existing.email,
              instagram: existing.instagram,
              similarity: 1,
              matchType: 'phone',
            });
            continue; // Skip other checks for this lead
          }
        }

        // Check email match
        if (normalizedNewEmail && existing.email) {
          const existingEmail = existing.email.toLowerCase().trim();
          if (normalizedNewEmail === existingEmail) {
            results.push({
              id: existing.id,
              company_name: existing.company_name,
              whatsapp: existing.whatsapp,
              email: existing.email,
              instagram: existing.instagram,
              similarity: 1,
              matchType: 'email',
            });
            continue;
          }
        }

        // Check instagram match
        if (normalizedNewInstagram && existing.instagram) {
          const existingInstagram = existing.instagram.toLowerCase().replace('@', '').trim();
          if (normalizedNewInstagram === existingInstagram) {
            results.push({
              id: existing.id,
              company_name: existing.company_name,
              whatsapp: existing.whatsapp,
              email: existing.email,
              instagram: existing.instagram,
              similarity: 1,
              matchType: 'instagram',
            });
            continue;
          }
        }

        // Check company name similarity
        const similarity = calculateSimilarity(lead.company_name, existing.company_name);
        
        if (similarity >= 0.85) {
          results.push({
            id: existing.id,
            company_name: existing.company_name,
            whatsapp: existing.whatsapp,
            email: existing.email,
            instagram: existing.instagram,
            similarity,
            matchType: similarity === 1 ? 'exact' : 'similar',
          });
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);
      
      // Limit to top 5 duplicates
      const topDuplicates = results.slice(0, 5);
      
      setDuplicates(topDuplicates);
      return topDuplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      setDuplicates([]);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearDuplicates = useCallback(() => {
    setDuplicates([]);
  }, []);

  return {
    duplicates,
    isChecking,
    checkDuplicates,
    clearDuplicates,
  };
}
