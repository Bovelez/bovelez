# bovelez

## Docker development

Run the full development stack from the repository root:

```bash
docker compose up --build
```

The web app runs at http://localhost:5173 and the API runs at http://localhost:8080.

The frontend reads `VITE_API_URL` as its browser-facing API base URL. In Docker development it defaults to `/api`, and Vite proxies those requests to the backend service through `VITE_API_PROXY_TARGET`.

To override the API URL:

```bash
VITE_API_URL=http://localhost:8080 docker compose up --build frontend
```

## Semantic versioning

Releases are automated with `semantic-release` from commits merged into `main`.
Use Conventional Commits so the CI release job can calculate the next version:

- `fix: ...` creates a patch release, for example `1.2.3` -> `1.2.4`.
- `feat: ...` creates a minor release, for example `1.2.3` -> `1.3.0`.
- `feat!: ...`, `fix!: ...`, or a commit body containing `BREAKING CHANGE:` creates a major release, for example `1.2.3` -> `2.0.0`.

The release workflow updates `backend/package.json`, `frontend/package.json`,
their lockfiles, `CHANGELOG.md`, creates a `vX.Y.Z` tag, and publishes a GitHub
release. To preview the next version locally, run:

```bash
npm run release:dry-run
```
