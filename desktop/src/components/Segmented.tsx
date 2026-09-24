import React from "react";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="glass-input flex gap-1 rounded-pill p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-pill px-3 py-1.5 text-xs font-medium transition ${
              on ? "bg-white text-apple-text shadow-sm" : "text-apple-muted hover:text-apple-text"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
