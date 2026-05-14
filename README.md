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
