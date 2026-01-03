import { Client, ClientStatus, ColumnId, CoverConfig, ClientLabel, PhotoMode } from "@/types/client";
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateClientInDb, softDeleteClient, restoreClientFromDb, permanentlyDeleteClientFromDb, createClient as createClientInDb } from "@/hooks/useClients";
import { mapRowToClient, ClientRow } from "@/lib/clientMapper";
import { getActiveConfigsByTrigger } from "@/hooks/useCommissionConfigs";

type ViewMode = "overview" | "kanban" | "table" | "timeline" | "calendar" | "cards" | "checklist" | "mytasks" | "sales-overview" | "recurring-overview" | "hoje" | "atrasadas" | "clientes";

// ID do item de pagamento de comissão no checklist
const COMMISSION_PAYMENT_ITEM_ID = "5-13";

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper to get role ID by label
const getRoleIdByLabel = async (label: string): Promise<string | null> => {
  const { data } = await supabase
    .from('commission_roles')
    .select('id')
    .ilike('label', label)
    .maybeSingle();
  return data?.id || null;
};

// Helper to create commissions based on configured rules for checklist complete
const createCommissionsFromConfig = async (client: Client) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    // Get all active configs for "checklist_complete" trigger
    const configs = await getActiveConfigsByTrigger('checklist_complete');
    
    if (configs.length === 0) {
      console.log("No commission configs found for checklist_complete trigger");
      return;
    }

    for (const config of configs) {
      const roleId = await getRoleIdByLabel(config.commission_type);

      // Check if commission already exists for this client + collaborator
      const { data: existing } = await (supabase
        .from("commissions_v2" as any)
        .select("id")
        .eq("client_id", client.id)
        .eq("recipient_name", config.collaborator_name)
        .maybeSingle() as any);

      if (existing) {
        continue; // Commission already exists, skip
      }

      // Calculate amount based on model
      let amount = config.amount;
      if (config.commission_model === 'percentage') {
        // For percentage, we'd need a sale value - for now use fixed
        amount = config.amount;
      }

      const { error } = await (supabase.from("commissions_v2" as any).insert({
        client_id: client.id,
        client_name: client.companyName,
        recipient_role_id: roleId,
        recipient_type: config.commission_type,
        recipient_name: config.collaborator_name,
        description: `Checklist completo - ${client.companyName}`,
        amount,
        status: config.initial_status,
        delivered_at: new Date().toISOString(),
        created_by: userId,
      }) as any);

      if (error) {
        console.error("Erro ao criar comissão:", error);
      } else {
        toast.success(`Comissão de R$ ${amount.toLocaleString("pt-BR")} registrada para ${config.collaborator_name}`, {
          description: "Gerada automaticamente (checklist completo)",
        });
      }
    }
  } catch (err) {
    console.error("Erro ao criar comissões:", err);
  }
};

// Helper to mark commission as paid when checklist item is checked
const markCommissionAsPaid = async (clientId: string, clientName: string) => {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  const operationalRoleId = await getRoleIdByLabel('Operacional');
  
  try {
    const { data: commission, error: fetchError } = await (supabase
      .from("commissions_v2" as any)
      .select("id, status, amount")
      .eq("client_id", clientId)
      .maybeSingle() as any);

    if (fetchError || !commission) {
      // If no commission exists, create one using config and mark as paid
      const configs = await getActiveConfigsByTrigger('checklist_complete');
      const config = configs[0]; // Get first matching config
      
      if (config) {
        const roleId = await getRoleIdByLabel(config.commission_type);
        const { error } = await (supabase.from("commissions_v2" as any).insert({
          client_id: clientId,
          client_name: clientName,
          recipient_role_id: roleId,
          recipient_type: config.commission_type,
          recipient_name: config.collaborator_name,
          description: `Checklist completo - ${clientName}`,
          amount: config.amount,
          status: "paid",
          delivered_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          created_by: userId,
        }) as any);

        if (!error) {
          toast.success(`Comissão de R$ ${config.amount.toLocaleString("pt-BR")} paga para ${config.collaborator_name}`, {
            description: "Pagamento registrado com sucesso",
          });
        }
      }
      return;
    }

    if (commission.status === "paid") {
      toast.info("Comissão já foi paga anteriormente");
      return;
    }

    const { error } = await (supabase
      .from("commissions_v2" as any)
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", commission.id) as any);

    if (error) {
      console.error("Erro ao marcar comissão como paga:", error);
      toast.error("Erro ao registrar pagamento");
    } else {
      toast.success(`Comissão de R$ ${Number(commission.amount).toLocaleString("pt-BR")} paga`, {
        description: "Pagamento registrado com sucesso",
      });
    }
  } catch (err) {
    console.error("Erro ao marcar comissão como paga:", err);
  }
};

// Helper to unmark commission as paid (when unchecking)
const unmarkCommissionAsPaid = async (clientId: string) => {
  try {
    const { error } = await (supabase
      .from("commissions_v2" as any)
      .update({ status: "pending", paid_at: null })
      .eq("client_id", clientId) as any);

    if (!error) {
      toast.info("Status da comissão voltou para pendente");
    }
  } catch (err) {
    console.error("Erro ao desmarcar comissão:", err);
  }
};

interface ClientStore {
  clients: Client[];
  deletedClients: Client[];
  selectedClient: Client | null;
  isDetailOpen: boolean;
  viewMode: ViewMode;
  availableLabels: ClientLabel[];
  isTrashOpen: boolean;
  isLoading: boolean;
  setClients: (clients: Client[]) => void;
  setDeletedClients: (clients: Client[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedClient: (client: Client | null) => void;
  setDetailOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setTrashOpen: (open: boolean) => void;
  addClient: (client: Omit<Client, 'id'>) => Promise<Client | null>;
  moveClient: (clientId: string, newColumnId: ColumnId) => void;
  deleteClient: (clientId: string) => void;
  restoreClient: (clientId: string) => void;
  permanentlyDeleteClient: (clientId: string) => void;
  toggleChecklistItem: (clientId: string, sectionId: string, itemId: string) => void;
  updateChecklistItemAttachment: (clientId: string, sectionId: string, itemId: string, url: string) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
  updateClientCover: (clientId: string, coverConfig: CoverConfig) => void;
  updateClientProfileImage: (clientId: string, imageUrl: string) => void;
  resetClientUpdateDate: (clientId: string) => void;
  addLabelToClient: (clientId: string, label: ClientLabel) => void;
  removeLabelFromClient: (clientId: string, labelId: string) => void;
  createLabel: (label: ClientLabel) => void;
  deleteLabel: (labelId: string) => void;
  addAttachment: (clientId: string, url: string) => void;
  removeAttachment: (clientId: string, url: string) => void;
  updateClientGoogleUrl: (clientId: string, url: string) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
}

const DEFAULT_LABELS: ClientLabel[] = [
  { id: "urgent", name: "Urgente", color: "#ef4444" },
  { id: "vip", name: "VIP", color: "#f59e0b" },
  { id: "new", name: "Novo", color: "#22c55e" },
  { id: "pending", name: "Pendente", color: "#8b5cf6" },
];

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  deletedClients: [],
  selectedClient: null,
  isDetailOpen: false,
  viewMode: "overview",
  availableLabels: DEFAULT_LABELS,
  isTrashOpen: false,
  isLoading: true,
  
  setClients: (clients) => set({ clients }),
  setDeletedClients: (deletedClients) => set({ deletedClients }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedClient: (client) => set({ selectedClient: client, isDetailOpen: !!client }),
  setDetailOpen: (open) => set({ isDetailOpen: open }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTrashOpen: (open) => set({ isTrashOpen: open }),

  addClient: async (clientData) => {
    const newClient = await createClientInDb(clientData);
    if (newClient) {
      set((state) => ({
        clients: [newClient, ...state.clients],
      }));
    }
    return newClient;
  },
  
  moveClient: async (clientId, newColumnId) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    const previousColumnId = client?.columnId;
    
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(c =>
        c.id === clientId
          ? { 
              ...c, 
              columnId: newColumnId, 
              lastUpdate: new Date().toISOString(),
              suspendedAt: newColumnId === "suspended" 
                ? (c.columnId !== "suspended" ? new Date().toISOString() : c.suspendedAt)
                : undefined
            }
          : c
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { 
            ...state.selectedClient, 
            columnId: newColumnId, 
            lastUpdate: new Date().toISOString(),
            suspendedAt: newColumnId === "suspended" 
              ? (state.selectedClient.columnId !== "suspended" ? new Date().toISOString() : state.selectedClient.suspendedAt)
              : undefined
          }
        : state.selectedClient,
    }));

    // Persist to database
    const updates: Partial<Client> = {
      columnId: newColumnId,
      lastUpdate: new Date().toISOString(),
      suspendedAt: newColumnId === "suspended" 
        ? (previousColumnId !== "suspended" ? new Date().toISOString() : client?.suspendedAt)
        : undefined
    };
    
    await updateClientInDb(clientId, updates);

    // Auto-create commission when moving to "delivered" from a non-delivered column
    if (client && newColumnId === "delivered" && previousColumnId !== "delivered") {
      createCommissionsFromConfig(client);
    }
  },

  deleteClient: async (clientId) => {
    const state = get();
    const clientToDelete = state.clients.find(c => c.id === clientId);
    if (!clientToDelete) return;
    
    // Optimistic update
    set((state) => ({
      clients: state.clients.filter(c => c.id !== clientId),
      deletedClients: [...state.deletedClients, { ...clientToDelete }],
      selectedClient: state.selectedClient?.id === clientId ? null : state.selectedClient,
      isDetailOpen: state.selectedClient?.id === clientId ? false : state.isDetailOpen,
    }));

    // Persist to database
    await softDeleteClient(clientId);
  },

  restoreClient: async (clientId) => {
    const state = get();
    const clientToRestore = state.deletedClients.find(c => c.id === clientId);
    if (!clientToRestore) return;
    
    // Optimistic update
    set((state) => ({
      deletedClients: state.deletedClients.filter(c => c.id !== clientId),
      clients: [...state.clients, { ...clientToRestore, lastUpdate: new Date().toISOString() }],
    }));

    // Persist to database
    await restoreClientFromDb(clientId);
  },

  permanentlyDeleteClient: async (clientId) => {
    // Optimistic update
    set((state) => ({
      deletedClients: state.deletedClients.filter(c => c.id !== clientId),
    }));

    // Persist to database
    await permanentlyDeleteClientFromDb(clientId);
  },
  
  toggleChecklistItem: async (clientId, sectionId, itemId) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    
    // Find current item state before toggle
    const currentItem = client?.checklist
      .find(s => s.id === sectionId)?.items
      .find(i => i.id === itemId);
    const isBeingChecked = currentItem && !currentItem.completed;

    // Handle commission payment item
    if (itemId === COMMISSION_PAYMENT_ITEM_ID && client) {
      if (isBeingChecked) {
        markCommissionAsPaid(client.id, client.companyName);
      } else {
        unmarkCommissionAsPaid(client.id);
      }
    }

    const updateChecklist = (checklist: Client["checklist"]) =>
      (checklist || []).map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: (section?.items || []).map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : undefined,
            };
          }),
        };
      });

    // Check if all items are completed after update
    const checkAllCompleted = (checklist: Client["checklist"]) => {
      return (checklist || []).every(section => 
        (section?.items || []).every(item => item.completed)
      );
    };

    let updatedClient: Client | null = null;

    // Optimistic update
    set((state) => {
      const newClients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        
        const updatedChecklist = updateChecklist(c.checklist);
        const allCompleted = checkAllCompleted(updatedChecklist);
        
        updatedClient = { 
          ...c, 
          lastUpdate: new Date().toISOString(), 
          checklist: updatedChecklist,
          columnId: allCompleted && c.columnId !== "finalized" ? "finalized" as const : c.columnId,
        };
        return updatedClient;
      });

      return {
        clients: newClients,
        selectedClient: state.selectedClient?.id === clientId && updatedClient
          ? updatedClient
          : state.selectedClient,
      };
    });

    // Persist to database
    if (updatedClient) {
      await updateClientInDb(clientId, {
        checklist: updatedClient.checklist,
        lastUpdate: updatedClient.lastUpdate,
        columnId: updatedClient.columnId,
      });
    }
  },

  updateChecklistItemAttachment: async (clientId, sectionId, itemId, url) => {
    const updateChecklist = (checklist: Client["checklist"]) =>
      (checklist || []).map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: (section?.items || []).map(item => {
            if (item.id !== itemId) return item;
            return { ...item, attachmentUrl: url };
          }),
        };
      });

    let updatedChecklist: Client["checklist"] | null = null;

    // Optimistic update
    set((state) => {
      return {
        clients: state.clients.map(client => {
          if (client.id !== clientId) return client;
          updatedChecklist = updateChecklist(client.checklist);
          return { ...client, checklist: updatedChecklist };
        }),
        selectedClient: state.selectedClient?.id === clientId
          ? { ...state.selectedClient, checklist: updateChecklist(state.selectedClient.checklist) }
          : state.selectedClient,
      };
    });

    // Persist to database
    if (updatedChecklist) {
      await updateClientInDb(clientId, { checklist: updatedChecklist });
    }
  },
  
  updateClientStatus: async (clientId, status) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, status, lastUpdate: new Date().toISOString() }
          : client
      ),
    }));

    // Persist to database
    await updateClientInDb(clientId, { status, lastUpdate: new Date().toISOString() });
  },

  updateClientCover: async (clientId, coverConfig) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, coverConfig }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, coverConfig }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { coverConfig });
  },

  updateClientProfileImage: async (clientId, imageUrl) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, profileImage: imageUrl || undefined }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, profileImage: imageUrl || undefined }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { profileImage: imageUrl || undefined });
  },

  resetClientUpdateDate: async (clientId) => {
    const now = new Date().toISOString();
    
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, lastUpdate: now }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, lastUpdate: now }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { lastUpdate: now });
  },

  addLabelToClient: async (clientId, label) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    const newLabels = [...(client?.labels || []), label];

    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, labels: newLabels }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, labels: newLabels }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { labels: newLabels });
  },

  removeLabelFromClient: async (clientId, labelId) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    const newLabels = (client?.labels || []).filter(l => l.id !== labelId);

    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, labels: newLabels }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, labels: newLabels }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { labels: newLabels });
  },

  createLabel: (label) => {
    set((state) => ({
      availableLabels: [...state.availableLabels, label],
    }));
  },

  deleteLabel: (labelId) => {
    set((state) => ({
      availableLabels: state.availableLabels.filter(l => l.id !== labelId),
      clients: state.clients.map(client => ({
        ...client,
        labels: (client.labels || []).filter(l => l.id !== labelId),
      })),
    }));
  },

  addAttachment: async (clientId, url) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    const newAttachments = [...(client?.attachments || []), url];

    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, attachments: newAttachments }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, attachments: newAttachments }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { attachments: newAttachments });
  },

  removeAttachment: async (clientId, url) => {
    const state = get();
    const client = state.clients.find(c => c.id === clientId);
    const newAttachments = (client?.attachments || []).filter(a => a !== url);

    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, attachments: newAttachments }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, attachments: newAttachments }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { attachments: newAttachments });
  },

  updateClientGoogleUrl: async (clientId, url) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, googleProfileUrl: url }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, googleProfileUrl: url }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, { googleProfileUrl: url });
  },

  updateClient: async (clientId, updates) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? { ...client, ...updates }
          : client
      ),
      selectedClient: state.selectedClient?.id === clientId
        ? { ...state.selectedClient, ...updates }
        : state.selectedClient,
    }));

    // Persist to database
    await updateClientInDb(clientId, updates);
  },
}));
