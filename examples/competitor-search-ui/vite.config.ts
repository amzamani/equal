import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@xray/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts')
        }
    },
    server: {
        port: 3002
    }
});
