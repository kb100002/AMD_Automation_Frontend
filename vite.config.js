import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': 'https://amd-automation-1.onrender.com',
            '/ws': {
                target: 'ws://localhost:8000',
                ws: true
            }
        }
    },
    base: '/AMD_Automation/',
})
