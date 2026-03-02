import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': 'https://amd-automation-1.onrender.com',
            '/ws': {
                target: 'wss://amd-automation-1.onrender.com',
                ws: true
            }
        }
    },
    base: '/AMD_Automation_Frontend/',
})
