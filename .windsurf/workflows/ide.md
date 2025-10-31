---
description: Start SPR Vice City dev server and open IDE preview
auto_execution_mode: 3
---

# IDE Command

Quick command to start the SPR Vice City development server and open IDE preview.

## Steps

1. Navigate to project root and start dev server:

   // turbo

   ```bash
   npm run dev
   ```

2. Wait 3 seconds for Vite to fully initialize

3. Open browser preview in IDE on detected port (usually 8080)

## Notes

- Project root: `C:\Users\rtsii\Desktop\violation\unit-scan-notify`
- Dev server uses Vite and will auto-assign available port (8080-8082)
- Auto-reload enabled on file changes
- Access directly at `http://localhost:8080` (or assigned port)
- Stop with Ctrl+C in terminal

## Quick Testing

After preview opens:

- Login with `rob@ursllc.com` credentials
- Navigate to Admin page (gear icon)
- Test DeleteSphereSpinner: expand card → select → delete