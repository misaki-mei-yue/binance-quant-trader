import React from "react";

export function TrafficLights() {
  const click = async (action: "close" | "minimize" | "maximize") => {
    if (!window.bq) return;
    if (action === "close") await window.bq.close();
    if (action === "minimize") await window.bq.minimize();
    if (action === "maximize") await window.bq.maximize();
  };
  return (
    <div className="no-drag flex items-center gap-2 pl-1">
      <button
        aria-label="关闭"
        onClick={() => click("close")}
        className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-sm hover:brightness-95"
      />
      <button
        aria-label="最小化"
        onClick={() => click("minimize")}
        className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-sm hover:brightness-95"
      />
      <button
        aria-label="最大化"
        onClick={() => click("maximize")}
        className="h-3 w-3 rounded-full bg-[#28C840] shadow-sm hover:brightness-95"
      />
    </div>
  );
}
