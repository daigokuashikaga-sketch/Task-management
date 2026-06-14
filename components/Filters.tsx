"use client";

import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/types";

interface FiltersProps {
  status: TaskStatus | "all";
  search: string;
  onStatusChange: (status: TaskStatus | "all") => void;
  onSearchChange: (search: string) => void;
}

export function Filters({
  status,
  search,
  onStatusChange,
  onSearchChange,
}: FiltersProps) {
  const tabs: Array<{ value: TaskStatus | "all"; label: string }> = [
    { value: "all", label: "すべて" },
    ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? "bg-slate-800 text-white"
                : "bg-surface text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="タスクを検索…"
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}
