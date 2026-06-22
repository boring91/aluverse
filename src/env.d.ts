/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string;
      readonly FROLLO_CLIENT_ID?: string;
      readonly FROLLO_PASSWORD?: string;
      readonly FROLLO_TENANT_ID?: string;
      readonly FROLLO_USERNAME?: string;
      readonly ADMIN_EMAIL?: string;
      readonly ADMIN_NAME?: string;
      readonly ADMIN_PASSWORD?: string;
      readonly VITE_API_URL?: string;
    }
  }
}

export {};
