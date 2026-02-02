
# Plano de Correção: Leads, Tabs Mobile e Edição de Campos

## Resumo dos Problemas Identificados

Após análise detalhada das imagens e código-fonte, foram encontrados **4 bugs críticos**:

### Problema 1: Tabs Sobrepostas/Ilegíveis no Mobile
**Localização**: `LeadDetailPanel.tsx` linha 144  
**Causa**: A TabsList usa `grid-cols-7` fixo (7 colunas) que não cabe em telas mobile
**Impacto**: Texto das abas aparece como "Resu🔥nAtivi📅EsrePaspostRaio🤖..." completamente ilegível

### Problema 2: Dados Não Salvando Após Edição
**Localização**: `LeadDetailPanel.tsx` função `handleFieldChange` (linha 67-70)  
**Causa**: Cada keystroke dispara uma chamada à API sem debounce
**Impacto**: 
- Sobrecarga da API (centenas de requests por edição)
- Dados parciais podem ser salvos antes de terminar a digitação
- Sem feedback visual de "salvando..."

### Problema 3: Header Sobrepondo Conteúdo
**Localização**: `LeadDetailPanel.tsx` estrutura do Dialog (linha 86-167)  
**Causa**: Em mobile, o header fixo não está sendo considerado no cálculo do scroll
**Impacto**: Tabs e badges ficam cortados/sobrepostos

### Problema 4: Falta de Refetch Imediato
**Localização**: `handleFieldChange` não força refetch após update  
**Causa**: Depende apenas de realtime (200-500ms delay)
**Impacto**: Usuário não vê mudanças imediatamente após editar

---

## Análise de Impacto nos Outros Funis

### Funil de Otimização (ClientDetailPanel.tsx)
- Usa apenas **4 tabs** → problema menos grave em mobile
- Não usa edição inline com `onChange` → sem problema de debounce
- **Ação**: Melhorar responsividade das tabs para mobile

### Funil de Recorrência (ClientRecurringCard.tsx / RecurringExecutionView.tsx)
- Não usa tabs → sem problema de sobreposição
- Usa checkboxes para completar tarefas (ações pontuais) → sem problema de debounce
- **Ação**: Nenhuma correção necessária

---

## Solução Detalhada

### Correção 1: Tabs Responsivas para Mobile
Mudanças em `LeadDetailPanel.tsx`:

```text
ANTES:
<TabsList className="grid w-full grid-cols-7 bg-muted/30">

DEPOIS (Mobile-First):
<TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/30">
```

Além disso, reduzir texto das tabs em mobile:
- "📌 Atividades" → "📌"
- "📅 Tarefas" → "📅"
- Etc.

### Correção 2: Debounce no handleFieldChange
Adicionar debounce de 500ms para evitar chamadas excessivas:

```typescript
// Estado local para valores temporários
const [localValues, setLocalValues] = useState<Record<string, any>>({});
const [isSaving, setIsSaving] = useState(false);

// Debounced save
const debouncedSave = useCallback(
  debounce(async (field: keyof Lead, value: any) => {
    setIsSaving(true);
    await updateLead(lead.id, { [field]: value });
    await refetch(); // Força atualização imediata
    setIsSaving(false);
    onUpdate();
  }, 500),
  [lead?.id, updateLead]
);

// Handler que atualiza local + agenda save
const handleFieldChange = (field: keyof Lead, value: any) => {
  setLocalValues(prev => ({ ...prev, [field]: value }));
  debouncedSave(field, value);
};
```

### Correção 3: Layout do Header para Mobile
Ajustar z-index e padding:

```text
<DialogContent className="... p-0 gap-0 overflow-hidden flex flex-col">
  <DialogHeader className="... shrink-0"> ... </DialogHeader>
  <Tabs className="flex-1 flex flex-col min-h-0"> ... </Tabs>
</DialogContent>
```

### Correção 4: Indicador de Salvamento
Adicionar feedback visual:

```typescript
{isSaving && (
  <Badge variant="outline" className="text-xs animate-pulse">
    Salvando...
  </Badge>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/leads/LeadDetailPanel.tsx` | Tabs responsivas, debounce, feedback visual |
| `src/components/ClientDetailPanel.tsx` | Tabs responsivas para mobile |

---

## Verificação dos Funis

### Checklist de Verificação Pós-Correção

**Funil de Vendas (Leads)**
- [ ] Tabs legíveis em iPhone SE (320px)
- [ ] Edição de campo salva após parar de digitar
- [ ] Badge "Salvando..." aparece durante save
- [ ] Dados aparecem imediatamente após salvar
- [ ] Header não sobrepõe tabs

**Funil de Otimização (Clientes)**
- [ ] Tabs legíveis em mobile
- [ ] Checklist funciona normalmente

**Funil de Recorrência**
- [ ] Cards exibidos corretamente em mobile
- [ ] Tarefas podem ser completadas/puladas

---

## Estimativa de Mudanças

- **LeadDetailPanel.tsx**: ~50 linhas modificadas
  - Import de `debounce` e `useCallback`
  - Estados locais para valores e salvando
  - Função `debouncedSave`
  - TabsList com layout flexível
  - Indicador de salvamento
  
- **ClientDetailPanel.tsx**: ~10 linhas modificadas
  - TabsList com layout flexível para mobile

---

## Resultado Esperado

Após as correções:
1. **Tabs 100% legíveis** em qualquer tamanho de tela
2. **Edição fluida** sem lag ou chamadas excessivas à API
3. **Feedback visual** mostrando quando dados estão sendo salvos
4. **Atualização imediata** dos dados após salvar
5. **Consistência** entre todos os funis do sistema
