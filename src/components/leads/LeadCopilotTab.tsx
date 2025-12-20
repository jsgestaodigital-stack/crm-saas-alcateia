import { LeadCopilotPanel } from './LeadCopilotPanel';

interface LeadCopilotTabProps {
  leadId: string;
}

export function LeadCopilotTab({ leadId }: LeadCopilotTabProps) {
  return <LeadCopilotPanel leadId={leadId} />;
}
