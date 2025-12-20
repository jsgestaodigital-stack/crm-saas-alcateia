import { useEffect, useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, Wand2, X, ChevronUp, Trash2, FolderPlus, ArrowRight, FileText, Camera, Search, Send, TrendingUp, TrendingDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClientStore } from "@/stores/clientStore";
import { DEFAULT_CHECKLIST, ColumnId } from "@/types/client";
import { findPotentialDuplicates } from "@/lib/duplicateUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/hooks/useLeads";

type VoiceAction = 
  | "CRIAR_CLIENTE"
  | "MOVER_CLIENTE"
  | "ADICIONAR_NOTA" 
  | "ATUALIZAR_BRIEFING" 
  | "MUDAR_FOTO_MODE" 
  | "BUSCAR_CLIENTE"
  | "EXCLUIR_CLIENTE"
  | "ADICIONAR_FOLLOWUP"
  | "ATUALIZAR_WHATSAPP"
  | "ATUALIZAR_DRIVE"
  | "ATUALIZAR_GOOGLE_PROFILE"
  | "MARCAR_TAREFA"
  // Lead actions
  | "CRIAR_LEAD"
  | "MOVER_LEAD_PIPELINE"
  | "GANHAR_LEAD"
  | "PERDER_LEAD"
  | "LEAD_FUTURO"
  | "ADICIONAR_ATIVIDADE_LEAD"
  | "ATUALIZAR_TEMPERATURA_LEAD"
  | "BUSCAR_LEAD"
  | "EXCLUIR_LEAD"
  // Error actions
  | "NAO_ENTENDIDO"
  | "SEM_PERMISSAO"
  | "ERRO";

interface SingleAction {
  action: VoiceAction;
  params: Record<string, any>;
  confidence: number;
  permission?: string;
}

interface VoiceCommandResult {
  actions: SingleAction[];
  summary: string;
  clientIdentified?: string;
  error?: boolean;
}

const COMMAND_EXAMPLES_OPS = [
  { icon: FolderPlus, text: "Adicionar cliente [nome] no onboarding", color: "text-status-success" },
  { icon: ArrowRight, text: "Mover [cliente] para entregue", color: "text-primary" },
  { icon: FileText, text: "Falei com [cliente], ela disse que...", color: "text-status-warning" },
  { icon: Camera, text: "O cliente [X] vai enviar as fotos", color: "text-purple-400" },
  { icon: Search, text: "Abrir [cliente]", color: "text-cyan-400" },
];

const COMMAND_EXAMPLES_SALES = [
  { icon: TrendingUp, text: "Fechei com o lead [nome]", color: "text-status-success" },
  { icon: TrendingDown, text: "Perdi o lead [nome], disse que...", color: "text-status-danger" },
  { icon: Phone, text: "Liguei pro [lead], agendei reunião", color: "text-primary" },
  { icon: ArrowRight, text: "Mover lead [X] para proposta", color: "text-status-warning" },
  { icon: FolderPlus, text: "Criar lead [empresa] quente", color: "text-purple-400" },
];

const COMMAND_EXAMPLES_ADMIN = [
  { icon: Trash2, text: "Excluir [cliente/lead]", color: "text-status-danger" },
];

export function VoiceCommandButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { clients, setSelectedClient, setDetailOpen, deleteClient, updateClient, moveClient } = useClientStore();
  const { user, permissions, isAdmin } = useAuth();
  const { leads, updateLead, createLead, deleteLead } = useLeads();

  // Build command examples based on permissions
  const commandExamples = [
    ...(permissions.canOps || isAdmin ? COMMAND_EXAMPLES_OPS : []),
    ...(permissions.canSales || isAdmin ? COMMAND_EXAMPLES_SALES : []),
    ...(permissions.canAdmin || isAdmin ? COMMAND_EXAMPLES_ADMIN : []),
  ];

  // Auto-close transcript after successful command execution
  useEffect(() => {
    if (executedActions.length > 0 && transcript && !isProcessing) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      
      autoCloseTimerRef.current = setTimeout(() => {
        setTranscript(null);
        setExecutedActions([]);
      }, 3000);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [executedActions, transcript, isProcessing]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(null);
      setExecutedActions([]);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Não foi possível acessar o microfone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Allow "Enter" to stop recording and execute the command
  useEffect(() => {
    if (!isRecording) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, stopRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscript(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      // Step 1: Transcribe audio
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptionError || !transcriptionData?.text) {
        throw new Error(transcriptionError?.message || 'Falha na transcrição');
      }

      const transcribedText = transcriptionData.text;
      setTranscript(transcribedText);
      console.log('Transcribed:', transcribedText);

      // Step 2: Prepare context data
      const clientsForContext = clients.map(c => ({
        id: c.id,
        companyName: c.companyName,
        columnId: c.columnId,
        mainCategory: c.mainCategory
      }));

      const leadsForContext = leads?.map(l => ({
        id: l.id,
        companyName: l.company_name,
        pipelineStage: l.pipeline_stage,
        temperature: l.temperature,
        status: l.status
      })) || [];

      // Step 3: Send permissions to backend
      const userPermissions = {
        canSales: permissions.canSales,
        canOps: permissions.canOps,
        canAdmin: permissions.canAdmin,
        canFinance: permissions.canFinance,
        isAdmin: isAdmin
      };

      console.log('Sending permissions:', userPermissions);

      // Step 4: Process command with rich context
      const { data: commandData, error: commandError } = await supabase.functions.invoke('process-voice-command', {
        body: { 
          transcription: transcribedText,
          clients: clientsForContext,
          leads: leadsForContext,
          permissions: userPermissions
        }
      });

      if (commandError) {
        throw new Error(commandError.message || 'Falha ao processar comando');
      }

      // Step 5: Execute all actions
      await executeMultipleActions(commandData as VoiceCommandResult);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar comando');
    } finally {
      setIsProcessing(false);
    }
  };

  const normalizeKey = (value?: string | null) => {
    if (!value) return "";
    return value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const resolveColumnId = (raw?: string | null): ColumnId | null => {
    const v = normalizeKey(raw);
    if (!v) return null;

    const direct = [
      "pipeline", "onboarding", "optimization", "ready_to_deliver",
      "finalized", "delivered", "suspended",
    ] as const;
    if ((direct as readonly string[]).includes(v)) return v as ColumnId;

    if (v.includes("para entrar") || v.includes("verificacao") || v.includes("entrada")) return "pipeline";
    if (v.includes("iniciar") || v.includes("comecar") || v.includes("onboarding")) return "onboarding";
    if (v.includes("otimiz")) return "optimization";
    if (v.includes("pendenc")) return "ready_to_deliver";
    if (v.includes("100") || v.includes("entregar") || v.includes("feito 100") || v.includes("finalizado")) return "finalized";
    if (v.includes("entregue") || v.includes("entregues")) return "delivered";
    if (v.includes("suspens") || v.includes("resolver")) return "suspended";

    return null;
  };

  const resolvePipelineStage = (raw?: string | null) => {
    const v = normalizeKey(raw);
    if (!v) return null;

    const stages = ["cold", "contacted", "qualified", "meeting_scheduled", "meeting_done", "proposal_sent", "negotiating", "future", "gained", "lost"];
    if (stages.includes(v)) return v;

    if (v.includes("frio")) return "cold";
    if (v.includes("contato") || v.includes("contatado")) return "contacted";
    if (v.includes("qualific")) return "qualified";
    if (v.includes("agenda") || v.includes("marcar")) return "meeting_scheduled";
    if (v.includes("reuniao") && v.includes("feita")) return "meeting_done";
    if (v.includes("proposta")) return "proposal_sent";
    if (v.includes("negoci")) return "negotiating";
    if (v.includes("futuro")) return "future";
    if (v.includes("ganho") || v.includes("fechou") || v.includes("converteu")) return "gained";
    if (v.includes("perdido") || v.includes("perdeu")) return "lost";

    return null;
  };

  const findClientByName = (name: string) => {
    if (!name) return null;
    
    if (name.toLowerCase().includes('último') || name.toLowerCase().includes('ultimo') || name.toLowerCase().includes('recente')) {
      const sortedClients = [...clients].sort((a, b) => 
        new Date(b.lastUpdate || b.startDate).getTime() - new Date(a.lastUpdate || a.startDate).getTime()
      );
      return sortedClients[0] || null;
    }
    
    const searchTerm = normalizeKey(name);
    
    let found = clients.find(c => normalizeKey(c.companyName) === searchTerm);
    if (found) return found;
    
    found = clients.find(c => 
      normalizeKey(c.companyName).includes(searchTerm) ||
      searchTerm.includes(normalizeKey(c.companyName))
    );
    
    return found || null;
  };

  const findLeadByName = (name: string) => {
    if (!name || !leads) return null;
    
    if (name.toLowerCase().includes('último') || name.toLowerCase().includes('ultimo') || name.toLowerCase().includes('recente')) {
      const sortedLeads = [...leads].sort((a, b) => 
        new Date(b.last_activity_at || b.created_at).getTime() - new Date(a.last_activity_at || a.created_at).getTime()
      );
      return sortedLeads[0] || null;
    }
    
    const searchTerm = normalizeKey(name);
    
    let found = leads.find(l => normalizeKey(l.company_name) === searchTerm);
    if (found) return found;
    
    found = leads.find(l => 
      normalizeKey(l.company_name).includes(searchTerm) ||
      searchTerm.includes(normalizeKey(l.company_name))
    );
    
    return found || null;
  };

  const createClientFromVoice = (args: { companyName: string; columnId: ColumnId; mainCategory?: string; city?: string }) => {
    const nowIso = new Date().toISOString();

    const newClient = {
      id: `cli-${Date.now()}`,
      companyName: args.companyName,
      mainCategory: args.mainCategory || undefined,
      city: args.city || undefined,
      planType: "unique" as const,
      isOwner: false,
      responsible: "Amanda" as const,
      startDate: new Date().toISOString().split("T")[0],
      lastUpdate: nowIso,
      status: "on_track" as const,
      columnId: args.columnId,
      suspendedAt: args.columnId === "suspended" ? nowIso : undefined,
      checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
      comparisons: [],
      history: [
        {
          id: `h-${Date.now()}`,
          action: "Cliente criado via comando de voz",
          user: "Sistema",
          timestamp: nowIso,
        },
      ],
      photoMode: "pending" as const,
      attachments: [],
    };

    useClientStore.setState((state) => ({
      clients: [...state.clients, newClient],
    }));

    return newClient;
  };

  const executeMultipleActions = async (result: VoiceCommandResult) => {
    console.log('Executing actions:', result);
    
    if (!result.actions || result.actions.length === 0) {
      toast.warning(result.summary || "Nenhuma ação identificada");
      return;
    }

    const executedList: string[] = [];
    let hasError = false;
    let permissionDenied = false;

    for (const actionItem of result.actions) {
      if (actionItem.action === 'SEM_PERMISSAO') {
        permissionDenied = true;
        toast.warning(`⚠️ ${result.summary}`);
        continue;
      }

      try {
        const success = await executeSingleAction(actionItem);
        if (success) {
          executedList.push(actionItem.action);
        }
      } catch (err) {
        console.error(`Error executing ${actionItem.action}:`, err);
        hasError = true;
      }
    }

    setExecutedActions(executedList);

    if (executedList.length > 0) {
      if (executedList.length === 1) {
        toast.success(`✅ ${result.summary}`);
      } else {
        toast.success(`✅ ${executedList.length} ações executadas: ${result.summary}`);
      }
    } else if (hasError && !permissionDenied) {
      toast.error("Erro ao executar ações");
    }
  };

  const executeSingleAction = async (actionItem: SingleAction): Promise<boolean> => {
    const { action, params } = actionItem;
    console.log(`Executing: ${action}`, params);

    switch (action) {
      // ============ CLIENT ACTIONS ============
      case 'CRIAR_CLIENTE': {
        if (!params.companyName) {
          toast.warning("Nome da empresa não informado");
          return false;
        }

        const duplicates = findPotentialDuplicates(params.companyName, clients);
        if (duplicates.length > 0 && duplicates[0].similarity >= 0.8) {
          toast.warning(`Já existe "${duplicates[0].client.companyName}" similar.`);
          return false;
        }
        
        const columnId = resolveColumnId(params.columnId) ?? "pipeline";
        createClientFromVoice({
          companyName: params.companyName,
          columnId,
          mainCategory: params.mainCategory,
          city: params.city,
        });

        return true;
      }

      case 'MOVER_CLIENTE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        const targetColumn = resolveColumnId(params.targetColumn);
        if (!targetColumn) {
          toast.warning("Coluna de destino não identificada");
          return false;
        }

        moveClient(client.id, targetColumn);
        return true;
      }

      case 'ADICIONAR_NOTA': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        const timestamp = new Date().toLocaleString('pt-BR');
        const currentBriefing = client.briefing || '';
        const newNote = `\n\n📝 [${timestamp}]\n${params.note}`;
        
        updateClient(client.id, {
          briefing: currentBriefing + newNote,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'ATUALIZAR_BRIEFING': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        updateClient(client.id, {
          briefing: params.briefing,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'MUDAR_FOTO_MODE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        const photoModeMap: Record<string, "with_photos" | "without_photos" | "pending"> = {
          "with_photos": "with_photos",
          "without_photos": "without_photos",
          "pending": "pending",
          "joao": "with_photos",
          "cliente": "without_photos",
        };

        const normalizedMode = normalizeKey(params.photoMode);
        const photoMode = photoModeMap[normalizedMode] || photoModeMap[params.photoMode] || "pending";

        updateClient(client.id, { photoMode, lastUpdate: new Date().toISOString() });
        return true;
      }

      case 'ADICIONAR_FOLLOWUP': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        const timestamp = new Date().toLocaleString('pt-BR');
        const currentBriefing = client.briefing || '';
        const followupNote = `\n\n⏰ FOLLOW-UP [${timestamp}]\n${params.followupNote}${params.followupDate ? `\n📅 Data: ${params.followupDate}` : ''}`;
        
        updateClient(client.id, {
          briefing: currentBriefing + followupNote,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'ATUALIZAR_WHATSAPP': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        updateClient(client.id, {
          whatsappLink: params.whatsappLink,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'ATUALIZAR_DRIVE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        updateClient(client.id, {
          driveUrl: params.driveUrl,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'ATUALIZAR_GOOGLE_PROFILE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        updateClient(client.id, {
          googleProfileUrl: params.googleProfileUrl,
          lastUpdate: new Date().toISOString()
        });
        return true;
      }

      case 'MARCAR_TAREFA': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        const taskDesc = normalizeKey(params.taskDescription);
        let taskFound = false;
        
        const updatedChecklist = client.checklist.map(section => ({
          ...section,
          items: section.items.map(item => {
            if (!taskFound && normalizeKey(item.title).includes(taskDesc)) {
              taskFound = true;
              return { ...item, completed: true, completedAt: new Date().toISOString() };
            }
            return item;
          })
        }));

        if (taskFound) {
          updateClient(client.id, { checklist: updatedChecklist, lastUpdate: new Date().toISOString() });
          return true;
        } else {
          toast.warning(`Tarefa "${params.taskDescription}" não encontrada`);
          return false;
        }
      }

      case 'BUSCAR_CLIENTE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        setSelectedClient(client);
        setDetailOpen(true);
        toast.success(`📋 Abrindo ${client.companyName}`);
        return true;
      }

      case 'EXCLUIR_CLIENTE': {
        const client = findClientByName(params.clientName);
        if (!client) {
          toast.warning(`Cliente "${params.clientName}" não encontrado`);
          return false;
        }

        deleteClient(client.id);
        toast.success(`🗑️ "${client.companyName}" movido para a lixeira`);
        return true;
      }

      // ============ LEAD ACTIONS ============
      case 'CRIAR_LEAD': {
        if (!params.companyName) {
          toast.warning("Nome da empresa não informado");
          return false;
        }

        if (!user) {
          toast.warning("Usuário não autenticado");
          return false;
        }

        const temperature = params.temperature || 'warm';
        const pipelineStage = params.pipelineStage || 'cold';

        await createLead({
          company_name: params.companyName,
          contact_name: params.contactName,
          phone: params.phone,
          city: params.city,
          main_category: params.mainCategory,
          temperature: temperature as 'cold' | 'warm' | 'hot',
          pipeline_stage: pipelineStage as any,
          created_by: user.id,
          responsible: user.id,
        });

        return true;
      }

      case 'MOVER_LEAD_PIPELINE': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        const targetStage = resolvePipelineStage(params.targetStage);
        if (!targetStage) {
          toast.warning("Estágio de destino não identificado");
          return false;
        }

        await updateLead(lead.id, { pipeline_stage: targetStage as any });
        return true;
      }

      case 'GANHAR_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        await updateLead(lead.id, { 
          pipeline_stage: 'gained',
          status: 'gained',
          notes: params.notes ? `${lead.notes || ''}\n\n🎉 GANHO: ${params.notes}` : lead.notes
        });
        
        toast.success(`🎉 Lead "${lead.company_name}" GANHO!`);
        return true;
      }

      case 'PERDER_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        await updateLead(lead.id, { 
          pipeline_stage: 'lost',
          status: 'lost',
          lost_notes: params.reason,
          notes: params.reason ? `${lead.notes || ''}\n\n❌ PERDIDO: ${params.reason}` : lead.notes
        });
        
        return true;
      }

      case 'LEAD_FUTURO': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        await updateLead(lead.id, { 
          pipeline_stage: 'future',
          status: 'future',
          notes: params.notes ? `${lead.notes || ''}\n\n📅 FUTURO: ${params.notes}` : lead.notes
        });
        
        return true;
      }

      case 'ADICIONAR_ATIVIDADE_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        // Add activity via notes for now (could be expanded to use lead_activities table)
        const timestamp = new Date().toLocaleString('pt-BR');
        const activityIcon = {
          whatsapp: '💬',
          call: '📞',
          meeting: '🤝',
          note: '📝',
          follow_up: '⏰',
          proposal: '📄',
          email: '✉️'
        }[params.type] || '📝';

        await updateLead(lead.id, { 
          notes: `${lead.notes || ''}\n\n${activityIcon} [${timestamp}] ${params.type.toUpperCase()}\n${params.content}`
        });
        
        return true;
      }

      case 'ATUALIZAR_TEMPERATURA_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        const tempMap: Record<string, 'cold' | 'warm' | 'hot'> = {
          'cold': 'cold', 'frio': 'cold',
          'warm': 'warm', 'morno': 'warm',
          'hot': 'hot', 'quente': 'hot'
        };

        const temp = tempMap[normalizeKey(params.temperature)] || 'warm';
        await updateLead(lead.id, { temperature: temp });
        
        return true;
      }

      case 'BUSCAR_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        // Navigate to leads view or open lead panel
        toast.success(`📋 Lead "${lead.company_name}" encontrado`);
        return true;
      }

      case 'EXCLUIR_LEAD': {
        const lead = findLeadByName(params.leadName);
        if (!lead) {
          toast.warning(`Lead "${params.leadName}" não encontrado`);
          return false;
        }

        await deleteLead(lead.id);
        toast.success(`🗑️ Lead "${lead.company_name}" excluído`);
        return true;
      }

      // ============ ERROR ACTIONS ============
      case 'NAO_ENTENDIDO':
        toast.warning("Não entendi o comando. Pode repetir de forma mais clara?");
        return false;

      case 'SEM_PERMISSAO':
        // Already handled in executeMultipleActions
        return false;

      case 'ERRO':
        toast.error("Erro ao processar comando");
        return false;

      default:
        console.warn('Unknown action:', action);
        return false;
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Don't render if user has no relevant permissions
  if (!permissions.canOps && !permissions.canSales && !permissions.canAdmin && !isAdmin) {
    return null;
  }

  return (
    <div className="relative">
      <div className={cn(
        "flex flex-col items-center transition-all duration-500",
        (isRecording || isProcessing || transcript) && "scale-105"
      )}>
        {/* Transcript Display */}
        {transcript && !isProcessing && (
          <div className="mb-3 px-4 py-3 bg-surface-2 border border-border/50 rounded-xl max-w-80 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-foreground leading-relaxed">"{transcript}"</p>
                {executedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {executedActions.map((action, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-status-success/20 text-status-success rounded-full">
                        ✓ {action.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-status-danger/10 border border-status-danger/30 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-status-danger rounded-full animate-ping" />
            <span className="text-xs font-medium text-status-danger">Ouvindo...</span>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs font-medium text-primary">Processando com IA...</span>
          </div>
        )}

        {/* Main Button Group */}
        <div className="flex items-center gap-2">
          {/* Help Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHelp(!showHelp)}
            className={cn(
              "w-10 h-10 rounded-full border-border/50 bg-surface-2 hover:bg-surface-2/80 transition-all",
              showHelp && "bg-primary/10 border-primary/50"
            )}
          >
            <ChevronUp
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                showHelp ? "rotate-180" : "rotate-0"
              )}
            />
          </Button>

          {/* Send button when recording */}
          {isRecording && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopRecording}
              className="rounded-full border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary gap-1"
            >
              <Send className="w-3 h-3" />
              Enviar
            </Button>
          )}

          {/* Main Mic Button */}
          <Button
            onClick={handleClick}
            disabled={isProcessing}
            className={cn(
              "relative w-16 h-16 rounded-full transition-all duration-300 shadow-lg",
              isRecording
                ? "bg-status-danger hover:bg-status-danger/90 shadow-status-danger/40"
                : "bg-primary hover:bg-primary/90 shadow-primary/30",
              isProcessing && "opacity-80 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}

            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-status-danger animate-ping opacity-40" />
                <span className="absolute inset-[-4px] rounded-full border-2 border-status-danger/30 animate-pulse" />
              </>
            )}

            {!isRecording && !isProcessing && (
              <span className="absolute inset-[-2px] rounded-full bg-primary/20 blur-md -z-10" />
            )}
          </Button>
        </div>

        {/* Label */}
        <span
          className={cn(
            "mt-2 text-xs font-medium transition-colors duration-300",
            isRecording
              ? "text-status-danger"
              : isProcessing
                ? "text-primary"
                : "text-muted-foreground"
          )}
        >
          {isProcessing
            ? "Analisando..."
            : isRecording
              ? "Gravando (Enter p/ enviar)"
              : "Comando de Voz"}
        </span>

        {/* Help Panel */}
        {showHelp && commandExamples.length > 0 && (
          <div className="mt-3 bg-surface-2 border border-border/50 rounded-xl p-4 shadow-xl w-80 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                Comandos Disponíveis
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6"
                onClick={() => setShowHelp(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {commandExamples.slice(0, 6).map((cmd, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <cmd.icon className={cn("w-4 h-4 mt-0.5 shrink-0", cmd.color)} />
                  <span className="text-muted-foreground">{cmd.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/70">
                💡 <strong>Dica:</strong> Fale naturalmente! A IA entende contexto e respeita suas permissões.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
