// Validação de senha forte - compartilhada entre frontend e backend
// Requisitos: 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  errors: string[];
  feedback: string[];
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Opcional, mas aumenta score
} as const;

/**
 * Valida uma senha e retorna detalhes sobre sua força
 */
export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  const feedback: string[] = [];
  let score = 0;

  // Verifica comprimento mínimo
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Senha deve ter pelo menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  } else {
    score++;
    if (password.length >= 12) {
      score++;
      feedback.push('Bom comprimento');
    }
  }

  // Verifica maiúscula
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else if (/[A-Z]/.test(password)) {
    score++;
  }

  // Verifica minúscula
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else if (/[a-z]/.test(password)) {
    score++;
  }

  // Verifica número
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  } else if (/[0-9]/.test(password)) {
    score++;
  }

  // Verifica caractere especial (bonus)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
    feedback.push('Caractere especial aumenta segurança');
  }

  // Score máximo = 6, normaliza para 4
  const normalizedScore = Math.min(4, Math.floor((score / 6) * 4));

  return {
    isValid: errors.length === 0,
    score: normalizedScore,
    errors,
    feedback,
  };
}

/**
 * Verifica se a senha é forte o suficiente (válida para uso)
 */
export function isStrongPassword(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Retorna texto do indicador de força
 */
export function getStrengthLabel(score: number): { label: string; color: string } {
  switch (score) {
    case 0:
      return { label: 'Muito fraca', color: 'text-destructive' };
    case 1:
      return { label: 'Fraca', color: 'text-orange-500' };
    case 2:
      return { label: 'Razoável', color: 'text-yellow-500' };
    case 3:
      return { label: 'Boa', color: 'text-blue-500' };
    case 4:
      return { label: 'Forte', color: 'text-green-500' };
    default:
      return { label: '', color: '' };
  }
}
