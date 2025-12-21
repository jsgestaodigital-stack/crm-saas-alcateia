/**
 * CPF Validation utilities
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas) numbers
 */

/**
 * Validates a CPF number using checksum algorithm
 * @param cpf - CPF string (with or without formatting)
 * @returns boolean indicating if CPF is valid
 */
export function isValidCpf(cpf: string): boolean {
  // Remove non-numeric characters
  const numbers = cpf.replace(/\D/g, '');
  
  // CPF must have 11 digits
  if (numbers.length !== 11) {
    return false;
  }
  
  // Check for known invalid patterns (all same digit)
  if (/^(\d)\1{10}$/.test(numbers)) {
    return false;
  }
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  let digit1 = remainder === 10 || remainder === 11 ? 0 : remainder;
  
  // Validate first check digit
  if (digit1 !== parseInt(numbers[9])) {
    return false;
  }
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  let digit2 = remainder === 10 || remainder === 11 ? 0 : remainder;
  
  // Validate second check digit
  if (digit2 !== parseInt(numbers[10])) {
    return false;
  }
  
  return true;
}

/**
 * Formats a CPF string to XXX.XXX.XXX-XX pattern
 * @param value - Raw CPF string
 * @returns Formatted CPF string
 */
export function formatCpf(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Validates CPF and returns error message if invalid
 * @param cpf - CPF string to validate
 * @returns Error message or null if valid
 */
export function validateCpf(cpf: string): string | null {
  const numbers = cpf.replace(/\D/g, '');
  
  if (!numbers) {
    return 'CPF é obrigatório';
  }
  
  if (numbers.length !== 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  if (!isValidCpf(cpf)) {
    return 'CPF inválido';
  }
  
  return null;
}
