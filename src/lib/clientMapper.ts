import { Client, ClientStatus, ColumnId, PhotoMode, ChecklistSection, CoverConfig, ClientLabel, Comparison, HistoryEntry, UsefulLink } from "@/types/client";
import { DEFAULT_CHECKLIST } from "@/types/client";

// Database row type
export interface ClientRow {
  id: string;
  company_name: string;
  google_profile_url: string | null;
  drive_url: string | null;
  whatsapp_group_url: string | null;
  whatsapp_link: string | null;
  whatsapp_link_short: string | null;
  plan_type: string;
  is_owner: boolean;
  main_category: string | null;
  keywords: string[] | null;
  notes: string | null;
  briefing: string | null;
  responsible: string;
  start_date: string;
  last_update: string;
  status: string;
  column_id: string;
  checklist: ChecklistSection[];
  comparisons: Comparison[];
  history: HistoryEntry[];
  attachments_count: number | null;
  profile_image: string | null;
  cover_config: CoverConfig | null;
  labels: ClientLabel[] | null;
  attachments: string[] | null;
  city: string | null;
  photo_mode: string | null;
  yahoo_email: string | null;
  suspended_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  useful_links: UsefulLink[] | null;
}

// Map database row to Client type
export function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    companyName: row.company_name,
    googleProfileUrl: row.google_profile_url || undefined,
    driveUrl: row.drive_url || undefined,
    whatsappGroupUrl: row.whatsapp_group_url || undefined,
    whatsappLink: row.whatsapp_link || undefined,
    whatsappLinkShort: row.whatsapp_link_short || undefined,
    planType: row.plan_type as "unique" | "recurring",
    isOwner: row.is_owner,
    mainCategory: row.main_category || undefined,
    keywords: row.keywords || undefined,
    notes: row.notes || undefined,
    briefing: row.briefing || undefined,
    responsible: row.responsible,
    startDate: row.start_date,
    lastUpdate: row.last_update,
    status: row.status as ClientStatus,
    columnId: row.column_id as ColumnId,
    checklist: row.checklist?.length ? row.checklist : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
    comparisons: row.comparisons || [],
    history: row.history || [],
    attachmentsCount: row.attachments_count || undefined,
    profileImage: row.profile_image || undefined,
    coverConfig: row.cover_config || undefined,
    labels: row.labels || undefined,
    attachments: row.attachments || undefined,
    city: row.city || undefined,
    photoMode: row.photo_mode as PhotoMode | undefined,
    yahooEmail: row.yahoo_email || undefined,
    suspendedAt: row.suspended_at || undefined,
    usefulLinks: row.useful_links || undefined,
  };
}

// Map Client type to database insert/update object
export function mapClientToRow(client: Partial<Client>): Partial<ClientRow> {
  const row: Partial<ClientRow> = {};

  if (client.id !== undefined) row.id = client.id;
  if (client.companyName !== undefined) row.company_name = client.companyName;
  if (client.googleProfileUrl !== undefined) row.google_profile_url = client.googleProfileUrl || null;
  if (client.driveUrl !== undefined) row.drive_url = client.driveUrl || null;
  if (client.whatsappGroupUrl !== undefined) row.whatsapp_group_url = client.whatsappGroupUrl || null;
  if (client.whatsappLink !== undefined) row.whatsapp_link = client.whatsappLink || null;
  if (client.whatsappLinkShort !== undefined) row.whatsapp_link_short = client.whatsappLinkShort || null;
  if (client.planType !== undefined) row.plan_type = client.planType;
  if (client.isOwner !== undefined) row.is_owner = client.isOwner;
  if (client.mainCategory !== undefined) row.main_category = client.mainCategory || null;
  if (client.keywords !== undefined) row.keywords = client.keywords || null;
  if (client.notes !== undefined) row.notes = client.notes || null;
  if (client.briefing !== undefined) row.briefing = client.briefing || null;
  if (client.responsible !== undefined) row.responsible = client.responsible;
  if (client.startDate !== undefined) row.start_date = client.startDate;
  if (client.lastUpdate !== undefined) row.last_update = client.lastUpdate;
  if (client.status !== undefined) row.status = client.status;
  if (client.columnId !== undefined) row.column_id = client.columnId;
  if (client.checklist !== undefined) row.checklist = client.checklist;
  if (client.comparisons !== undefined) row.comparisons = client.comparisons;
  if (client.history !== undefined) row.history = client.history;
  if (client.attachmentsCount !== undefined) row.attachments_count = client.attachmentsCount || null;
  if (client.profileImage !== undefined) row.profile_image = client.profileImage || null;
  if (client.coverConfig !== undefined) row.cover_config = client.coverConfig || null;
  if (client.labels !== undefined) row.labels = client.labels || null;
  if (client.attachments !== undefined) row.attachments = client.attachments || null;
  if (client.city !== undefined) row.city = client.city || null;
  if (client.photoMode !== undefined) row.photo_mode = client.photoMode || null;
  if (client.yahooEmail !== undefined) row.yahoo_email = client.yahooEmail || null;
  if (client.suspendedAt !== undefined) row.suspended_at = client.suspendedAt || null;
  if (client.usefulLinks !== undefined) row.useful_links = client.usefulLinks || null;

  return row;
}

// Create new client object for insertion
export function createClientInsertRow(client: Omit<Client, 'id'>): Omit<ClientRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {
  return {
    company_name: client.companyName,
    google_profile_url: client.googleProfileUrl || null,
    drive_url: client.driveUrl || null,
    whatsapp_group_url: client.whatsappGroupUrl || null,
    whatsapp_link: client.whatsappLink || null,
    whatsapp_link_short: client.whatsappLinkShort || null,
    plan_type: client.planType,
    is_owner: client.isOwner,
    main_category: client.mainCategory || null,
    keywords: client.keywords || null,
    notes: client.notes || null,
    briefing: client.briefing || null,
    responsible: client.responsible,
    start_date: client.startDate,
    last_update: client.lastUpdate,
    status: client.status,
    column_id: client.columnId,
    checklist: client.checklist,
    comparisons: client.comparisons,
    history: client.history,
    attachments_count: client.attachmentsCount || null,
    profile_image: client.profileImage || null,
    cover_config: client.coverConfig || null,
    labels: client.labels || null,
    attachments: client.attachments || null,
    city: client.city || null,
    photo_mode: client.photoMode || null,
    yahoo_email: client.yahooEmail || null,
    suspended_at: client.suspendedAt || null,
    useful_links: client.usefulLinks || null,
  };
}
