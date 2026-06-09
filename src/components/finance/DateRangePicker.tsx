'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  onChange?: (range: DateRange) => void;
}

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyPreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        // Start of current week (Sunday)
        start.setDate(today.getDate() - today.getDay());
        end = today;
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastmonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        end = today;
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        break;
    }

    const startStr = formatLocalDate(start);
    const endStr = formatLocalDate(end);
    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedPreset(preset);
    if (onChange) {
      onChange({ startDate: startStr, endDate: endStr });
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedPreset(null);
    if (onChange) {
      onChange({ startDate: val, endDate });
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedPreset(null);
    if (onChange) {
      onChange({ startDate, endDate: val });
    }
  };

  const clearRange = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPreset(null);
    if (onChange) {
      onChange({ startDate: '', endDate: '' });
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-secondary border border-border">
      {/* Row 1: Inputs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Calendar className="w-4 h-4 text-[#d4a853]" />
          <span>Date Range:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-[#d4a853] w-36"
          />
          <span className="text-muted-foreground text-xs font-medium">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-[#d4a853] w-36"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border w-full" />

      {/* Row 2: Presets */}
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        <span className="text-[10px] uppercase font-bold text-[#d4a853] mr-1.5 tracking-wider">Presets:</span>
        {['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter', 'This Year'].map((label) => {
          const key = label.toLowerCase().replace(' ', '');
          const normalizedKey = key === 'thisweek' ? 'week' : key === 'thismonth' ? 'month' : key === 'thisquarter' ? 'quarter' : key === 'thisyear' ? 'year' : key;
          return (
            <button
              key={label}
              type="button"
              onClick={() => applyPreset(normalizedKey)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${selectedPreset === normalizedKey
                ? 'bg-[#d4a853] border border-[#d4a853] '
                : 'bg-card border border-border text-neutral-600 dark:text-neutral-400 hover:text-[#d4a853] hover:border-[#d4a853]/40 hover:bg-[#d4a853]/10 dark:hover:bg-[#d4a853]/10'
                }`}
            >
              {label}
            </button>
          );
        })}

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={clearRange}
            className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all md:ml-auto"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );
}
