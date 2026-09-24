import React from "react";

export function TrafficLights() {
  const click = async (action: "close" | "minimize" | "maximize") => {
    if (!window.bq) return;
    if (action === "close") await window.bq.close();
    if (action === "minimize") await window.bq.minimize();
    if (action === "maximize") await window.bq.maximize();
  };
  return (
    <div className="no-drag flex items-center gap-2.5 pl-1 pr-2">
      <button
        type="button"
        aria-label="关闭"
        title="关闭 (也可按 Alt+F4)"
        onClick={() => click("close")}
        className="h-3.5 w-3.5 rounded-full bg-[#FF5F57] shadow-sm ring-1 ring-black/5 hover:brightness-95"
      />
      <button
        type="button"
        aria-label="最小化"
        title="最小化"
        onClick={() => click("minimize")}
        className="h-3.5 w-3.5 rounded-full bg-[#FEBC2E] shadow-sm ring-1 ring-black/5 hover:brightness-95"
      />
      <button
        type="button"
        aria-label="最大化"
        title="最大化"
        onClick={() => click("maximize")}
        className="h-3.5 w-3.5 rounded-full bg-[#28C840] shadow-sm ring-1 ring-black/5 hover:brightness-95"
      />
    </div>
  );
}
