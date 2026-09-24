/// <reference types="vite/client" />

export type StartOpts = {
  strategyKey: string;
  apiKey?: string;
  apiSecret?: string;
  pairs?: string[];
  timeframe?: string;
  dryRun?: boolean;
  leverageMax?: number;
};

export type FtStatus = {
  running?: boolean;
  strategy?: string;
  dryRun?: boolean;
  error?: string;
};

declare global {
  interface Window {
    bq?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      getPaths: () => Promise<{
        root: string;
        userData: string;
        freqtrade: string;
        packaged: boolean;
      }>;
      start: (opts: StartOpts) => Promise<{ ok: boolean; error?: string }>;
      stop: () => Promise<boolean>;
      isRunning: () => Promise<boolean>;
      listStrategies: () => Promise<unknown[]>;
      onLog: (cb: (line: string) => void) => () => void;
      onStatus: (cb: (s: FtStatus) => void) => () => void;
    };
  }
}

export {};
