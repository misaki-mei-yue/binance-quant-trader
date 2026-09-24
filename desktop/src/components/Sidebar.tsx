import React from "react";
import { LayoutDashboard, TrendingUp, Grid3X3, Zap, ScrollText, Settings } from "lucide-react";
import { NAV_ITEMS, NavKey } from "../lib/strategies";

const ICONS: Record<string, React.ReactNode> = {
  layout: <LayoutDashboard size={18} strokeWidth={1.75} />,
  trending: <TrendingUp size={18} strokeWidth={1.75} />,
  grid: <Grid3X3 size={18} strokeWidth={1.75} />,
  zap: <Zap size={18} strokeWidth={1.75} />,
  list: <ScrollText size={18} strokeWidth={1.75} />,
  settings: <Settings size={18} strokeWidth={1.75} />,
};

export function Sidebar({ active, onChange }: { active: NavKey; onChange: (k: NavKey) => void }) {
  return (
    <aside className="glass flex w-[88px] shrink-0 flex-col items-stretch gap-1 border-r border-white/40 px-2 py-4">
      <div className="mb-4 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7EC2F5] to-[#4A9FE0] shadow-soft">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L20 19H4L12 3Z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
      </div>
      {NAV_ITEMS.map((item) => {
        const on = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`no-drag flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] transition-all ${
              on
                ? "bg-apple-pill text-white shadow-soft"
                : "text-apple-muted hover:bg-white/50 hover:text-apple-text"
            }`}
          >
            <span className={on ? "text-white" : "text-apple-muted"}>{ICONS[item.icon]}</span>
            <span className="leading-tight">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
