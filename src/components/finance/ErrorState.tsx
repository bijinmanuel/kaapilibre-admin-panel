import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'An error occurred while loading the financial data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-red-500/10 rounded-2xl bg-red-500/5 min-h-[300px]">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 text-red-400 animate-pulse">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Failed to load data</h3>
      <p className="text-xs text-red-400/80 mt-1 max-w-[280px] leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
