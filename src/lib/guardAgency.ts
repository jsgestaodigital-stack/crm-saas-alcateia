/**
 * Guard utility — garante que o usuário tem uma agência ativa antes de
 * disparar mutations que dependem de `current_agency_id()` no banco.
 *
 * Lança um Error com mensagem amigável quando não há agência selecionada.
 * O catch do hook captura e mostra um toast com `getErrorMessage`.
 */
export function requireAgencyId(agencyId: string | null | undefined): string {
  if (!agencyId) {
    throw new Error(
      'Nenhuma agência ativa. Configure sua agência antes de continuar.'
    );
  }
  return agencyId;
}
