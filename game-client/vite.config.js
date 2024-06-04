// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'src', // Set the root directory for the project
    build: {
        outDir: '../dist', // Output directory for the build
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'), // Alias for src directory
        },
    },
    server: {
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3000', // Proxy WebSocket server
                ws: true,
            },
        },
    },
});
