import { z } from 'zod';

// Brazilian phone validation regex
const BRAZIL_PHONE_REGEX = /^\(?[1-9]{2}\)?[\s.-]?(?:9[\s.-]?)?[0-9]{4}[\s.-]?[0-9]{4}$/;

// Basic phone validation (more permissive for international)
const BASIC_PHONE_REGEX = /^[\d\s().+-]{8,20}$/;

// Instagram validation
const INSTAGRAM_REGEX = /^@?[a-zA-Z0-9._]{1,30}$/;

export const leadFormSchema = z.object({
  company_name: z.string()
    .trim()
    .min(2, 'Nome do negócio deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do negócio deve ter no máximo 100 caracteres'),
  
  contact_name: z.string()
    .trim()
    .max(100, 'Nome do contato deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  whatsapp: z.string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      return BASIC_PHONE_REGEX.test(val);
    }, 'Número de telefone inválido'),
  
  email: z.string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      return z.string().email().safeParse(val).success;
    }, 'E-mail inválido'),
  
  instagram: z.string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      return INSTAGRAM_REGEX.test(val);
    }, 'Instagram inválido (use @usuario ou apenas o nome)'),
  
  city: z.string().trim().max(100).optional().or(z.literal('')),
  main_category: z.string().trim().max(100).optional().or(z.literal('')),
  source_id: z.string().optional().or(z.literal('')),
  temperature: z.enum(['cold', 'warm', 'hot']).default('cold'),
  next_action: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// Phone number formatting and validation
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Brazilian format
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

export function validateBrazilianPhone(phone: string): { valid: boolean; message?: string } {
  if (!phone) return { valid: true };
  
  const digits = phone.replace(/\D/g, '');
  
  // Check length
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  // Check DDD (area code)
  const ddd = parseInt(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valid: false, message: 'DDD inválido' };
  }
  
  // Check for fake numbers (all same digits)
  const uniqueDigits = new Set(digits).size;
  if (uniqueDigits <= 2) {
    return { valid: false, message: 'Número parece ser inválido' };
  }
  
  // Check for common fake patterns
  const fakePatterns = [
    '12345678', '87654321', '11111111', '22222222',
    '00000000', '99999999', '123456789', '987654321'
  ];
  
  for (const pattern of fakePatterns) {
    if (digits.includes(pattern)) {
      return { valid: false, message: 'Número parece ser inválido' };
    }
  }
  
  return { valid: true };
}

export function formatInstagram(instagram: string): string {
  if (!instagram) return '';
  
  // Ensure it starts with @
  const cleaned = instagram.trim().replace(/^@/, '');
  return cleaned ? `@${cleaned}` : '';
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) return { valid: true };
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'E-mail inválido' };
  }
  
  // Check for disposable email domains
  const disposableDomains = [
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'maildrop.cc'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, message: 'E-mails temporários não são aceitos' };
  }
  
  return { valid: true };
}

// Duplicate detection utilities
export interface DuplicateResult {
  id: string;
  company_name: string;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  similarity: number;
  matchType: 'exact' | 'similar' | 'phone' | 'email' | 'instagram';
}

export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  return 1 - matrix[s1.length][s2.length] / maxLen;
}
