import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no financial transactions recorded for this section yet.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-2xl bg-card/30 min-h-[300px]">
      <div className="w-12 h-12 rounded-2xl bg-[#d4a853]/10 flex items-center justify-center mb-4 text-[#d4a853]">
        <FolderOpen className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#d4a853] text-[#1a1713] hover:bg-[#d4a853]/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
