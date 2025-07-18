# Copilot Instructions for AI Logo Generator

## Project Overview

- **Purpose:** Chat-based AI logo generator that produces branding packages, animated SVGs, and realistic mockups.
- **Tech Stack:** Next.js (App Router), React 18, Vercel AI SDK, Tailwind CSS, TypeScript, Vercel hosting.

## Key Architectural Patterns

- **App Directory Structure:** Uses Next.js `/app` directory for routing and server/client components.
- **Component Organization:**
  - UI components in `components/ui/`
  - Logo generation logic in `components/logo-generator/`
  - Providers in `components/providers/`
- **Chat Workflow:**
  - Main chat logic in `components/logo-generator/chat-interface.tsx` using `useChat` from `@ai-sdk/react`.
  - Logo generation is triggered by `[GENERATE_LOGO]` in assistant messages.
  - File uploads handled via `file-upload-unified` component.
- **Mockup System:**
  - Backgrounds in `public/assets/mockups/backgrounds/`
  - Registry in `lib/mockups/background-image-registry.ts`

## Developer Workflows

- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Run tests:** `npm test` (Vitest)
- **Lint:** `npm run lint` or `npm run lint:fix`
- **Typecheck:** `npm run typecheck`
- **Enhanced mockup test page:** `npm run dev` then visit `/test-mockups`

## Project-Specific Conventions

- **Logo Generation Trigger:** Use `[GENERATE_LOGO]` in assistant messages to start logo creation.
- **File Uploads:** Use the `FileUploadUnified` component and manage files via `selectedFiles` state.
- **Error Handling:** Use the `useToast` hook for user notifications.
- **Styling:** Use Tailwind CSS utility classes. Custom UI primitives are in `components/ui/`.
- **TypeScript:** All new code should be typed. Types for React 18 are required (`@types/react@18`).
- **Vercel Deploy:** Build/install scripts are standard (`npm install`, `npm run build`). No `--legacy-peer-deps`.

## Integration Points

- **AI SDK:** Uses `@ai-sdk/react` for chat and streaming.
- **External APIs:** Anthropic, OpenAI, Vercel AI SDK.
- **SVG/Animation:** SVG output and animation logic in `components/logo-generator/` and related docs.

## References

- Main chat: `components/logo-generator/chat-interface.tsx`
- Mockup registry: `lib/mockups/background-image-registry.ts`
- Enhanced mockup docs: `docs/ENHANCED_MOCKUP_SYSTEM.md`
- Project structure: `docs/archive/PROJECT_STRUCTURE.md`

---

**For AI agents:**

- Follow the chat-to-logo workflow and trigger conventions.
- Use project-specific UI and state patterns.
- Reference the README and docs for feature details and file locations.
- Keep all code TypeScript- and React 18-compliant.
