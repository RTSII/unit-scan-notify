---
description: Open SPR Vice City dev server in IDE preview
---

# IDE Preview Workflow

This workflow starts the development server and opens the browser preview in the IDE.

## Steps

1. Check if dev server is already running by looking for existing process on ports 8080-8082

2. If not running, start the dev server:

   // turbo

   ```bash
   npm run dev
   ```

3. Wait 3 seconds for server to fully initialize

4. Open browser preview in IDE using the detected port (usually 8082)

## Notes

- The dev server will auto-reload on file changes
- If ports 8080-8082 are in use, Vite will automatically find the next available port
- You can also access directly at `http://localhost:8082` (or whichever port Vite assigns)
- To stop the server, use Ctrl+C in the terminal or close the terminal window

## Testing the Delete Animation

To test the new DeleteSphereSpinner:

1. Navigate to Admin page (gear icon from Dashboard)
2. Find a violation form in the carousel
3. Click to expand the details card
4. Check the "Select" checkbox
5. Click the trash icon
6. Watch the spinning sphere animation (clockwise rotation with cyan/pink/purple colors)
7. Form will be deleted and removed from UI after animation completes
