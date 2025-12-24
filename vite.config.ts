import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-google-ads',
      writeBundle() {
        const srcDir = 'src/GoogleAdsConsentManagement'
        const destDir = 'dist/src/GoogleAdsConsentManagement'
        
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true })
        }
        
        copyFileSync(join(srcDir, 'index.html'), join(destDir, 'index.html'))
        
        const frontendDestDir = join(destDir, 'frontend')
        if (!existsSync(frontendDestDir)) {
          mkdirSync(frontendDestDir, { recursive: true })
        }
        
        copyFileSync(join(srcDir, 'frontend/index.html'), join(frontendDestDir, 'index.html'))
        copyFileSync(join(srcDir, 'frontend/simple.html'), join(frontendDestDir, 'simple.html'))
        copyFileSync(join(srcDir, 'frontend/dashboard.html'), join(frontendDestDir, 'dashboard.html'))
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
})
