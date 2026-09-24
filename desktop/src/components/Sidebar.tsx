import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Grid3X3,
  Zap,
  ScrollText,
  Settings,
  Star,
  BookOpen,
  Bot,
  Brain,
} from "lucide-react";
import { NAV_ITEMS, NavKey } from "../lib/strategies";

const ICONS: Record<string, React.ReactNode> = {
  layout: <LayoutDashboard size={16} strokeWidth={1.75} />,
  trending: <TrendingUp size={16} strokeWidth={1.75} />,
  grid: <Grid3X3 size={16} strokeWidth={1.75} />,
  zap: <Zap size={16} strokeWidth={1.75} />,
  list: <ScrollText size={16} strokeWidth={1.75} />,
  settings: <Settings size={16} strokeWidth={1.75} />,
  star: <Star size={16} strokeWidth={1.75} />,
  book: <BookOpen size={16} strokeWidth={1.75} />,
  bot: <Bot size={16} strokeWidth={1.75} />,
  brain: <Brain size={16} strokeWidth={1.75} />,
};

export function Sidebar({ active, onChange }: { active: NavKey; onChange: (k: NavKey) => void }) {
  return (
    <aside className="glass flex w-[96px] shrink-0 flex-col items-stretch border-r border-white/40">
      <div className="flex justify-center px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7EC2F5] to-[#4A9FE0] shadow-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L20 19H4L12 3Z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
      </div>
      <div className="scroll-thin flex flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-3">
        {NAV_ITEMS.map((item) => {
          const on = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              title={item.group ? `${item.group} · ${item.label}` : item.label}
              className={`no-drag flex flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 text-[10px] transition-all ${
                on
                  ? "bg-apple-pill text-white shadow-soft"
                  : "text-apple-muted hover:bg-white/50 hover:text-apple-text"
              }`}
            >
              <span className={on ? "text-white" : "text-apple-muted"}>{ICONS[item.icon]}</span>
              <span className="leading-tight text-center">{item.label}</span>
              {item.group && (
                <span
                  className={`mt-0.5 rounded px-1 text-[8px] leading-none ${
                    on ? "bg-white/25 text-white" : "bg-black/5 text-apple-muted"
                  }`}
                >
                  {item.group}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
