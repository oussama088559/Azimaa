import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// Conservative targets so old Android WebViews can run the app
export default defineConfig({ base: './', plugins: [react()], build: { target: 'es2019', cssTarget: 'chrome80' } });
