import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // Specify the entry point if not default
    build: {
        rollupOptions: {
            input: path.resolve(__dirname, 'src/index.tsx'), // Adjust path as necessary
        },
    },
});
