/// <reference types="vite/client" />

export type StartOpts = {
  strategyKey: string;
  apiKey?: string;
  apiSecret?: string;
  password?: string;
  exchange?: string;
  pairs?: string[];
  timeframe?: string;
  dryRun?: boolean;
  leverageMax?: number;
};

export type FtStatus = {
  running?: boolean;
  strategy?: string;
  dryRun?: boolean;
  apiReady?: boolean;
  exchange?: string;
  error?: string;
};

export type UiSettings = {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  password: string;
  dryRun: boolean;
};

export type LlmSettings = {
  base_url: string;
  api_key: string;
  model_name: string;
  enabled: boolean;
  timeout_sec?: number;
};

declare global {
  interface Window {
    bq?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      platform: string;
      getPaths: () => Promise<{
        root: string;
        userData: string;
        freqtrade: string;
        python?: string;
        packaged: boolean;
      }>;
      start: (opts: StartOpts) => Promise<{ ok: boolean; error?: string }>;
      stop: () => Promise<boolean>;
      isRunning: () => Promise<boolean>;
      listStrategies: () => Promise<unknown[]>;
      ftApi: (req: Record<string, unknown>) => Promise<{
        ok?: boolean;
        error?: string;
        data?: unknown;
        apiReady?: boolean;
        base?: string | null;
        wsUrl?: string | null;
      }>;
      getSettings: () => Promise<UiSettings>;
      saveSettings: (partial: Partial<UiSettings>) => Promise<UiSettings>;
      testExchange: (opts?: Partial<UiSettings>) => Promise<{ ok: boolean; message?: string; error?: string }>;
      getLlm: () => Promise<LlmSettings>;
      saveLlm: (partial: Partial<LlmSettings>) => Promise<LlmSettings>;
      testLlm: (partial?: Partial<LlmSettings>) => Promise<{ ok: boolean; message?: string; error?: string; preview?: string }>;
      onLog: (cb: (line: string) => void) => () => void;
      onStatus: (cb: (s: FtStatus) => void) => () => void;
    };
  }
}

export {};
