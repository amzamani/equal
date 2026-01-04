/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string
    readonly VITE_XRAY_ENDPOINT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
