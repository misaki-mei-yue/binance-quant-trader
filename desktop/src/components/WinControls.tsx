import React from "react";

/** Windows-style caption buttons (top-right ×) for frameless Electron windows. */
export function WinControls() {
  const click = async (action: "close" | "minimize" | "maximize") => {
    if (!window.bq) return;
    if (action === "close") await window.bq.close();
    if (action === "minimize") await window.bq.minimize();
    if (action === "maximize") await window.bq.maximize();
  };

  return (
    <div className="no-drag flex h-12 items-stretch">
      <button
        type="button"
        aria-label="最小化"
        title="最小化"
        onClick={() => click("minimize")}
        className="flex w-12 items-center justify-center text-apple-text/70 hover:bg-black/5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="最大化"
        title="最大化"
        onClick={() => click("maximize")}
        className="flex w-12 items-center justify-center text-apple-text/70 hover:bg-black/5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="关闭"
        title="关闭"
        onClick={() => click("close")}
        className="flex w-12 items-center justify-center text-apple-text/80 hover:bg-[#E81123] hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M2.2 2.2 L9.8 9.8 M9.8 2.2 L2.2 9.8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
