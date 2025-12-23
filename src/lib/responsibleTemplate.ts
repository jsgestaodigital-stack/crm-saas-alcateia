export type ResponsibleRole = 'manager' | 'ops' | 'client' | 'system' | 'unknown';

const ROLE_LABEL: Record<ResponsibleRole, string> = {
  manager: 'Gestor (Comercial)',
  ops: 'Operacional',
  client: 'Cliente',
  system: 'Sistema',
  unknown: 'Equipe',
};

const ROLE_SHORT: Record<ResponsibleRole, string> = {
  manager: 'GC',
  ops: 'OP',
  client: 'CL',
  system: 'SYS',
  unknown: 'EQ',
};

function normalize(raw?: string | null) {
  return (raw ?? '').toString().trim().toLowerCase();
}

export function toResponsibleRole(raw?: string | null): ResponsibleRole {
  const v = normalize(raw);

  // Accept either real names or role-like labels (template)
  if (!v) return 'unknown';
  if (v.includes('sistema')) return 'system';
  if (v.includes('cliente')) return 'client';

  // Legacy labels (names) -> roles
  if (v.includes('joao') || v.includes('joão')) return 'manager';
  if (v.includes('amanda')) return 'ops';

  // Template labels
  if (v.includes('gestor') || v.includes('comercial') || v.includes('vendas')) return 'manager';
  if (v.includes('operacional') || v.includes('operacao') || v.includes('operação')) return 'ops';

  return 'unknown';
}

export function getResponsibleLabel(raw?: string | null) {
  return ROLE_LABEL[toResponsibleRole(raw)];
}

export function getResponsibleShort(raw?: string | null) {
  return ROLE_SHORT[toResponsibleRole(raw)];
}
