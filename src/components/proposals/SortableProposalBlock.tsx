import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProposalBlockComponent } from './ProposalBlock';
import { ProposalBlock } from '@/types/proposal';

interface SortableProposalBlockProps {
  block: ProposalBlock;
  onUpdate: (block: ProposalBlock) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  variables: Record<string, string>;
}

export function SortableProposalBlock({
  block,
  onUpdate,
  onDelete,
  isFirst,
  isLast,
  variables,
}: SortableProposalBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProposalBlockComponent
        block={block}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isFirst={isFirst}
        isLast={isLast}
        variables={variables}
        dragListeners={listeners}
      />
    </div>
  );
}
