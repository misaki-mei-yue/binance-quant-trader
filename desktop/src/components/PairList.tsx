import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { displayPair, pairList } from "../lib/market";

export function PairList({
  mode,
  value,
  onChange,
}: {
  mode: "spot" | "futures";
  value: string;
  onChange: (p: string) => void;
}) {
  const [q, setQ] = useState("");
  const pairs = useMemo(() => {
    const all = pairList(mode);
    const qq = q.trim().toUpperCase();
    if (!qq) return all;
    return all.filter((p) => displayPair(p).includes(qq) || p.includes(qq));
  }, [mode, q]);

  return (
    <div className="flex h-full w-[148px] shrink-0 flex-col border-r border-apple-line bg-white/40">
      <div className="border-b border-apple-line p-2">
        <div className="glass-input flex items-center gap-1 rounded-xl px-2 py-1.5">
          <Search size={14} className="text-apple-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索"
            className="w-full bg-transparent text-xs outline-none placeholder:text-apple-muted"
          />
        </div>
        <div className="mt-1 text-[10px] text-apple-muted">{mode === "futures" ? "U本位合约" : "现货"}</div>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto">
        {pairs.map((p) => {
          const on = p === value;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-xs ${
                on ? "bg-apple-pill/15 text-apple-text font-semibold" : "text-apple-muted hover:bg-white/60"
              }`}
            >
              <span>{displayPair(p)}</span>
              <span className={`text-[10px] ${on ? "text-apple-pill" : ""}`}>USDT</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
