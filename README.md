# DTR

DTR uses SolidJS 2 and TanStack Solid Start. The compatible framework packages are pinned to `2.0.0-rc.8` in `package.json` and `bun.lock`. Upgrade them together.

Install dependencies with `bun install --frozen-lockfile`. Configure Clerk and Turso in `.env` or `.env.local`:

- `VITE_CLERK_PUBLISHABLE_KEY` or the existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `TURSO_CONNECTION_URL`
- `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY` for organization invitations
- `NEXT_PUBLIC_APP_URL` for invitation links

Start development manually with `bun run dev`, then open http://localhost:3000.

Run `bun run typecheck`, `bun run lint`, and `bun test tests` to check changes. Tests use temporary databases and mocked external services. Run `bun run build` followed by `bun run verify:build` to check the production server handler without starting a server.

For a production build using the existing production environment file, run `bun --env-file=.env.prod run build`. Start the built app with `node --env-file=.env.prod .output/server/index.mjs`. Keep environment files out of source control.

Routes live in `src/routes`, screens in `src/pages` and `components`, and API handlers in `server`. The database schema and CLI API paths retain their existing contracts.
