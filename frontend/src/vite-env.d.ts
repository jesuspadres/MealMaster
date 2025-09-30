
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    // Add other env variables here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  
  // Allow importing .tsx files without explicit extension
  declare module '*.tsx' {
    const content: any;
    export default content;
  }