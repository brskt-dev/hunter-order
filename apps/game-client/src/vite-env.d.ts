/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional log level override: debug | info | warn | error | silent. */
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
