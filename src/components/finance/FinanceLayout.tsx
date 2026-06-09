import React from 'react';

interface FinanceLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FinanceLayout({ title, description, children }: FinanceLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {title}
          <span className="w-1.5 h-6 rounded bg-[#d4a853]" />
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
