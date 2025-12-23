import { useState } from "react";
import { Check, Paperclip, HelpCircle, Timer, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChecklistItem as ChecklistItemType } from "@/types/client";
import { useTaskTimer } from "@/hooks/useTaskTimer";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { getResponsibleShort } from "@/lib/responsibleTemplate";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  item: ChecklistItemType;
  clientId: string;
  clientName: string;
  sectionTitle: string;
  onToggle: () => void;
  onAttachmentChange?: (url: string) => void;
  isStalled?: boolean;
}

const TASK_TIPS: Record<string, string> = {
  "1-1": "Crie o grupo incluindo o Operacional para começar o onboarding",
  "1-2": "Use a foto padrão RANKEIA que está na pasta de assets",
  "1-3": "Envie mensagem de boas-vindas padrão e pergunte disponibilidade",
  "1-4": "Agende para no máximo 48h após entrada do cliente",
  "2-1": "Crie na pasta 'Fazendo' dentro do Drive compartilhado",
  "2-2": "Use o Agente GBRank CRM para manter contexto de cada cliente",
  "2-3": "Capture a pontuação atual antes de qualquer alteração",
  "2-4": "Importante para comparativo no relatório final",
  "2-5": "Capture volume de buscas das principais keywords",
  "2-6": "Pergunte: diferencial, público-alvo, horários, serviços principais",
  "2-7": "Registre todas as informações importantes do briefing aqui",
  "2-8": "Crie 3-5 slogans e peça aprovação do cliente",
  "2-9": "Crie versão longa e curta para diferentes usos",
  "2-10": "Ative o botão de chat do Google Business Profile",
  "3-1": "Defina com o cliente se o Gestor vai presencialmente ou se o cliente envia",
  "3-2": "Leve equipamento profissional e tire fotos dos ambientes principais",
  "3-3": "Peça fotos da fachada, interior, produtos/serviços em destaque",
  "4-1": "Use Lightroom para ajustar cores, luz e enquadramento",
  "4-2": "Organize em subpastas: Fotos Originais, Fotos Editadas",
  "4-3": "Configure template com coordenadas e keywords do cliente",
  "4-4": "Necessário para cadastros em diretórios externos",
  "5-1": "Use GLIBATREE para criar imagens de produtos 1200x1200",
  "5-2": "Use GLIBATREE para criar artes de postagens 1200x900",
  "5-3": "Crie QR Code direcionando para WhatsApp ou perfil Google",
  "5-4": "Pegue do Instagram ou crie compilações simples no Canva",
  "6-1": "Preencha todos os campos: endereço, telefone, horários, etc.",
  "6-2": "Use palavras-chave naturalmente nas respostas às avaliações",
  "6-3": "Pesquise concorrentes para identificar melhores categorias",
  "6-4": "GeoSetter adiciona metadados de localização e keywords",
  "6-5": "Suba fotos na ordem: logo, fachada, interior, produtos",
  "6-6": "Nome do serviço + KW na descrição (ex: 'Corte Masculino Premium')",
  "6-7": "Use GBRank CRM AI para criar descrições otimizadas para SEO",
  "6-8": "Cadastre todos os produtos com preços quando possível",
  "6-9": "Descrições devem ter keywords e chamar para ação",
  "6-10": "Crie postagens sobre serviços, promoções, novidades",
  "6-11": "Use GBRank CRM AI para criar textos persuasivos",
  "6-12": "Ex: 'Barbearia Premium em Florianópolis' - validar com o Gestor",
  "6-13": "Responda perguntas existentes ou crie novas relevantes",
  "6-14": "Perguntas frequentes melhoram visibilidade no Google",
  "7-1": "Cadastre em pelo menos 10 diretórios relevantes do setor",
  "7-2": "Use mesmo nome otimizado do Google Business",
  "7-3": "Crie página da empresa com descrição e links",
  "7-4": "Cadastre com mesmo nome e bio otimizados",
  "7-5": "Crie boards relevantes para o negócio",
  "7-6": "Mesmo nome e bio dos outros perfis",
  "7-7": "Consistência de nome em todas as plataformas é crucial",
  "8-1": "Verifique se está tudo organizado e acessível",
  "8-2": "Capture nova pontuação para comparar com inicial",
  "8-3": "Capture novo posicionamento para relatório",
  "8-4": "Use Fireshot para captura de página inteira",
  "8-5": "Monte documento visual mostrando evolução",
  "8-6": "Destaque ganhos de posicionamento na keyword principal",
  "9-1": "Cliente deve aparecer como proprietário, RANKEIA como admin",
  "9-2": "Garanta acesso para suporte futuro",
  "9-3": "Envie link organizado com todos os materiais",
  "9-4": "Mostre evolução visual e estratégica do perfil",
  "9-5": "Momento ideal para pedir indicações é na entrega",
  "9-6": "Se cliente for engajado, ofereça plano mensal",
};

export function ChecklistItem({ 
  item, 
  clientId,
  clientName,
  sectionTitle,
  onToggle, 
  onAttachmentChange 
}: ChecklistItemProps) {
  const [attachmentUrl, setAttachmentUrl] = useState(item.attachmentUrl || "");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const tip = TASK_TIPS[item.id];
  
  const { 
    activeTimer, 
    elapsedSeconds, 
    startTimer, 
    stopTimer, 
    isTimerActiveForTask, 
    formatTime,
    hasActiveTimer 
  } = useTaskTimer();

  const isTimerActive = isTimerActiveForTask(item.id);

  const handleSaveAttachment = () => {
    onAttachmentChange?.(attachmentUrl);
    setIsPopoverOpen(false);
  };

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTimerActive) {
      stopTimer();
    } else {
      startTimer(clientId, clientName, item.id, item.title, sectionTitle);
    }
  };

  return (
    <TooltipProvider delayDuration={1000}>
      <div
        className={cn(
          "group flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all",
          item.completed 
            ? "bg-transparent opacity-60" 
            : "hover:bg-surface-3/50",
          isTimerActive && "bg-primary/10 ring-1 ring-primary/30"
        )}
        onClick={onToggle}
      >
        {/* Checkbox minimalista */}
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.completed 
            ? "bg-status-success border-status-success" 
            : "border-muted-foreground/40 hover:border-primary group-hover:border-primary"
        )}>
          {item.completed && <Check className="w-3 h-3 text-status-success-foreground" />}
        </div>

        {/* Título */}
        <span className={cn(
          "flex-1 text-sm",
          item.completed ? "line-through text-muted-foreground" : "text-foreground"
        )}>
          {item.title}
        </span>

        {/* Timer display when active */}
        {isTimerActive && (
          <span className="text-xs font-mono font-bold text-primary animate-pulse">
            {formatTime(elapsedSeconds)}
          </span>
        )}

        {/* Badge responsável */}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-primary/20 text-primary">
          {getResponsibleShort(item.responsible)}
        </span>

        {/* Ações */}
        <div className={cn(
          "flex items-center gap-1 transition-opacity",
          isTimerActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {/* Timer button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-6 h-6 transition-all",
                  isTimerActive 
                    ? "text-primary bg-primary/20 hover:bg-primary/30" 
                    : hasActiveTimer && !isTimerActive
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                onClick={handleTimerClick}
                disabled={hasActiveTimer && !isTimerActive}
              >
                {isTimerActive ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Timer className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="glass max-w-[280px]">
              <p className="font-medium mb-1">
                {isTimerActive 
                  ? "Parar cronômetro" 
                  : hasActiveTimer 
                    ? "Outro cronômetro ativo" 
                    : "Cronômetro"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{TOOLTIP_CONTENT.checklist.timer}</p>
            </TooltipContent>
          </Tooltip>

          {tip && (
            <Tooltip>
              <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-primary">
                  <HelpCircle className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass max-w-[280px]">
                <p className="font-medium mb-1">Dica</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-6 h-6",
                  item.attachmentUrl ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Anexar link</h4>
                <Input
                  placeholder="Cole o link aqui..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsPopoverOpen(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveAttachment}>
                    Salvar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
}
