# 21st.dev Toolbar Integration (React + Vite)

This project integrates the 21st.dev Toolbar to enable AI-powered, in-browser selection and annotations that connect to coding agents in your IDE.

## Packages

Installed as devDependencies:
- `@21st-extension/toolbar-react` — React toolbar component
- `@21st-extension/react` — React integration plugin for the toolbar

Recommended VS Code extension:
- `21st.21st-extension`

A workspace `extensions.json` is included at the repo root with this recommendation.

## How it is wired

- Top-level integration in `src/App.tsx`:
  - Imports `TwentyFirstToolbar` from `@21st-extension/toolbar-react` and `ReactPlugin` from `@21st-extension/react`.
  - Renders the toolbar once at the bottom of the `App` component.
  - Only enabled in development mode.
  - Includes a Floating UI toggle (bottom-right) for enabling/disabling the toolbar at runtime in development. Preference persists in `localStorage` under the key `toolbarEnabled`.

```tsx
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';

// ...inside App()
<TwentyFirstToolbar
  enabled={import.meta.env.DEV && toolbarEnabled}
  config={{
    plugins: [
      // Important: pass ReactPlugin directly (don't call it)
      ReactPlugin,
    ],
  }}
/>
```

## Why not `initToolbar`?

The framework-agnostic `@21st-extension/toolbar` package exposes `initToolbar`. For React projects, use the React-specific component instead. It avoids double initialization, handles dev-only gating internally, and supports the React plugin for element selection/annotation.

## Expected behavior

1. Toolbar loads only in development (`import.meta.env.DEV`).
2. Toolbar is excluded from production builds.
3. No SSR/server execution (client-only rendering).
4. No lint errors from the integration.
5. Toolbar initializes once per page load.

## Troubleshooting

- ReactPlugin is not a function
  - Cause: Calling `ReactPlugin()` when the package exports a plugin object.
  - Fix: Pass `ReactPlugin` directly in the `plugins` array.

- Multiple GoTrueClient instances detected
  - This warning originates from Supabase auth and is unrelated to the toolbar. It usually indicates multiple auth clients using the same storage key in the same browser context.

- Toolbar not visible in production
  - Intended. The toolbar is dev-only. Use the local toggle or `enabled={...}` prop for explicit control.

## Customizing the toggle

We provide a small dev-only floating button to flip the toolbar on/off without rebuilding:

- Location: bottom-right corner
- Storage key: `toolbarEnabled`
- To remove: delete the button block in `src/App.tsx` or guard it behind a custom environment flag

## Security notes

- The toolbar is a developer tool. Never expose it in production.
- Do not embed secrets in configuration or commit API keys.
