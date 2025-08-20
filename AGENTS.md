# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` with `components/`, `pages/` (e.g., `HomePage.tsx`), `hooks/`, `lib/`, `contexts/`, `types/`, and `test/` utilities.
- Entry points: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/AppRouter.tsx`.
- Assets: `public/` (e.g., `manifest.webmanifest`, redirects). Build output: `dist/`.
- Config: `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `tsconfig*.json`, custom ESLint rules in `eslint-rules/`.
- Aliases: import app code via `@/…` (see `tsconfig` and `vite.config`).

## Build, Test, and Development Commands
- `npm run dev`: install deps and start Vite on `:8080`.
- `npm run build`: install deps, build, and copy `index.html` to `404.html`.
- `npm run test`: type-check, lint (TS + HTML), run unit tests (Vitest/jsdom), then build.
- Deploy: `npm run deploy` (nostr-deploy-cli), `npm run deploy:cloudflare` or `:preview` (Wrangler Pages).

## Coding Style & Naming Conventions
- Language: TypeScript + React 18. Components in `.tsx`; utilities in `.ts`.
- Naming: Components `PascalCase`, hooks `useX`, pages `*Page.tsx`, tests `*.test.ts(x)` colocated.
- Linting: ESLint with TypeScript, React Hooks, HTML rules and custom rules in `eslint-rules/`.
  - No inline `eslint-disable` (enforced). Avoid placeholder comments and inline `<script>` in HTML.
- TailwindCSS for styling; prefer utility classes and `tailwind-merge`.

## Testing Guidelines
- Frameworks: Vitest + @testing-library/react with `jsdom`. Global setup: `src/test/setup.ts`.
- Place tests next to code (`*.test.ts`/`*.test.tsx`). Favor user-facing assertions via Testing Library.
- Run locally: `npm run test` or `vitest run` (CI mode). Keep tests deterministic; mock browser APIs as needed.

## Commit & Pull Request Guidelines
- Commits: imperative, present tense (e.g., "Add profile page"). Keep focused; reference issue IDs when applicable.
- PRs: include summary, motivation, screenshots for UI changes, and test coverage for new logic.
- CI hygiene: ensure `npm run test` passes locally before opening/merging PRs.

## Security & Deployment Notes
- Do not commit secrets. Configure deploy targets via `wrangler.toml` and environment variables.
- Verify `public/manifest.webmanifest` and HTML meta requirements (HTML ESLint rules) before deploy.
