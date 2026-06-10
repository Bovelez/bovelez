# Bovelez — Resumen del proyecto

**Bovelez** es un tracker de portafolios de acciones. Los usuarios se registran/inician
sesión, compran y venden acciones (validadas contra SEC EDGAR) y ven su portafolio con
precios en vivo. Es un monorepo con varios componentes orquestados por Docker Compose.

## Arquitectura general

| Componente | Stack | Rol |
|------------|-------|-----|
| `backend/` | NestJS + Prisma (TypeScript) | API REST principal, protegida por JWT |
| `frontend/` | React + Vite (TypeScript) | SPA web |
| `front-mobile/` | React + Vite (TypeScript) | SPA "mobile" (la que se prueba con Appium) |
| `price-service/` | Python + FastAPI | Microservicio que obtiene precios de Yahoo Finance |
| `docker-compose.yml` | — | Orquesta los servicios + Postgres |

- **Base de datos**: Postgres vía Prisma. Modelos clave: `User`, `Transaction` (BUY/SELL),
  `StockPrice` (ticker → precio actual), `PriceBatchRun` (metadatos del batch),
  `EdgarCompany` (caché CIK + ticker + nombre), y la watchlist por usuario.
- **Posiciones del portafolio**: **no tienen tabla propia**. Se calculan "al vuelo"
  reproduciendo (replay) todos los `Transaction` del usuario con costo promedio FIFO.
- **Guard JWT global**: registrado en `AppModule` como `APP_GUARD`; todas las rutas están
  protegidas por defecto. Se opta por salir con el decorador `@Public()`.
- **Capas por módulo** (backend): `controller` (HTTP) → `service` (lógica) →
  `repository` (Prisma, siempre detrás de una interfaz) + `dto`/`input`. Los repositorios
  se inyectan por tokens string (ej. `@Inject('TransactionsRepository')`) para mockear fácil.

---

## 1. Cómo funcionan las APIs

### 1.1 SEC EDGAR (datos de empresas, filings y métricas financieras)

EDGAR es la fuente oficial de la SEC. El backend la consume desde **4 clientes HTTP
distintos**, cada uno apuntando a un endpoint de EDGAR diferente, todos enviando un header
`User-Agent: PortfolioTracker contact@portfolio.com` (la SEC lo exige). Orquestados por
`EdgarService`, que añade **caché de 24 h** (`cache-manager`) sobre la mayoría de las
llamadas.

| Cliente | Endpoint EDGAR | Para qué |
|---------|----------------|----------|
| `EdgarClient` | `https://www.sec.gov/files/company_tickers.json` | Lista maestra de empresas (CIK ↔ ticker ↔ nombre). Resuelve ticker → empresa y valida tickers. |
| `EdgarSearchClient` | `https://efts.sec.gov/LATEST/search-index` | Búsqueda full-text de empresas (filtra por formularios `10-K`), deduplica por CIK. |
| `EdgarSubmissionsClient` | `https://data.sec.gov/submissions/CIK##########.json` | Filings recientes (solo `10-K` y `10-Q`, máx. 10), arma la URL del documento. |
| `EdgarFactsClient` | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | Métricas financieras XBRL: revenue, net income, EPS, total assets, total liabilities. |

**Detalles importantes:**

- **CIK con padding**: el CIK se rellena a 10 dígitos con ceros (`padStart(10,'0')`) para
  los endpoints `data.sec.gov`.
- **Métricas trimestrales** (`EdgarFactsClient`): es la parte más compleja. Mapea varios
  conceptos US-GAAP por métrica (ej. revenue tiene 5 nombres posibles según la empresa).
  Para métricas de flujo (revenue/net income/EPS), que en los `10-K` vienen acumuladas al
  año, **sintetiza el Q4** restando los 3 trimestres previos del total anual. Elige el
  concepto cuyo dato más reciente sea más nuevo (evita datos viejos de conceptos legacy).
- **Validación de ticker** (`isValidTicker`): se usa al comprar y al agregar a watchlist.
  Primero exige que exista precio (`pricesService.getPrice`), luego que exista en
  `EdgarCompany` local o, como fallback, que aparezca en la lista maestra de EDGAR.
- **Caché de 24 h**: `searchCompanies`, `getFilings` y `getMetrics` se cachean por clave
  (query/ticker normalizado + cantidad de trimestres). La primera llamada pega a la SEC;
  las siguientes salen de caché. Esto es clave para no superar el límite de **10 req/s**
  de EDGAR bajo carga.
- **Nota**: `GET /edgar/search` existe en el backend pero **no es alcanzable desde la UI**
  (los buscadores filtran la lista de `/prices` en el cliente). Es código muerto desde la
  perspectiva del frontend, aunque la caché ya está aplicada por si se conecta una página
  de búsqueda.

### 1.2 Yahoo Finance (precios) vía `price-service`

El microservicio Python (`price-service/main.py`, FastAPI) es la única pieza que habla con
Yahoo Finance. Expone:

- `POST /prices/fetch` — recibe `{ tickers: [...] }`, devuelve `{ prices, dailyChangePercentages, errors }`.
  Resuelve cada ticker en paralelo con un `ThreadPoolExecutor` (hasta 40 workers).
- `GET /health` — healthcheck.

**Estrategia de obtención de precio (con fallback):**

1. **`yfinance`** con una sesión que usa `User-Agent` de browser (preferido). `yfinance`
   maneja internamente el "crumb"/cookies de Yahoo.
2. **HTTP directo al endpoint v8 de Yahoo** (`query1.finance.yahoo.com/v8/finance/chart/{ticker}`)
   como fallback. Esto es necesario en entornos de datacenter (Render, Docker) donde
   `yfinance` suele ser rate-limited en su flujo de autenticación.

Calcula además el cambio porcentual diario respecto al cierre previo.

### 1.3 Cómo usa el backend al `price-service`

El módulo `prices` del backend:

- Llama por HTTP a `PRICE_SERVICE_URL` (`http://price-service:8000` en Docker).
- Guarda los resultados en `StockPrice` y registra cada corrida en `PriceBatchRun`.
- **Seed en el arranque** (`PricesStartupSeeder`): si `StockPrice` está vacía, hace un batch
  con todos los tickers del S&P 500 (o los de `SPY_TICKERS`). Si ya hay datos, solo refresca
  los que les falte el cambio diario. Controlable con `SEED_SPY_PRICES_ON_STARTUP`.
- **Scheduler** (`PricesSchedulerService`): un cron `@Cron(EVERY_HOUR)` re-corre el batch.
- `POST /prices/update` dispara el batch manualmente. **No se somete a pruebas de carga
  continua** (no debe martillar a Yahoo).

### 1.4 Endpoints internos de la API (resumen)

| Módulo | Rutas |
|--------|-------|
| `auth` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (registra/loguea, emite JWT, hashea con argon2id) |
| `users` | `DELETE /users/me` (borra cuenta) |
| `transactions` | `POST /transactions/buy`, `POST /transactions/sell`, `GET /transactions/:ticker`, `GET /transactions` |
| `portfolio` | `GET /portfolio` (agrega posiciones abiertas + precios; sin tabla propia) |
| `prices` | `POST /prices/update`, `GET /prices/last-run`, `GET /prices`, `GET /prices/:ticker` |
| `edgar` | `GET /edgar/search`, `GET /edgar/companies`, `GET /edgar/companies/:ticker`, `PATCH /edgar/companies/:ticker/sync`, `GET /edgar/companies/:ticker/filings`, `GET /edgar/companies/:ticker/metrics` |
| `watchlist` | `GET /watchlist`, `POST /watchlist`, `DELETE /watchlist/:ticker`, `POST /watchlist/compare` |

---

## 2. Appium (E2E mobile)

Pruebas E2E del **front-mobile** corriendo en un navegador **Chrome dentro de un emulador
Android**, conducido por Appium. El código vive en `front-mobile/appium/`.

### Cómo está implementado

- **No usa el cliente WebdriverIO**. Hay un wrapper propio, `support/webdriver.mjs`
  (`AppiumBrowser`), que habla **directo con el servidor Appium por su API REST/W3C WebDriver**
  vía `fetch`: crea sesión (`POST /session`), navega (`POST /session/{id}/url`), busca
  elementos por CSS, hace click, type, ejecuta JS (`execute/sync`), lee texto, etc.
  Incluye helpers de espera (`waitFor`, `waitForText`, `waitForUrl`, `waitForEnabled`) y
  reintentos ante "stale element".
- **Capabilities**: `platformName: Android`, `browserName: Chrome`,
  `automationName: UiAutomator2`, con `chromedriverAutodownload`.
- **Page Objects** (`appium/screens/*.mjs`): una clase por pantalla
  (`auth`, `dashboard`, `portfolio`, `stock`, `transactions`, `watchlist`) que encapsula los
  selectores `data-testid`/`data-cy` y las acciones de esa pantalla.
- **Soporte** (`appium/support/`):
  - `api-client.mjs` — llama directo a la API del backend (sembrar datos vía REST).
  - `test-data.mjs` — registra usuarios únicos por REST, inyecta el token en `localStorage`,
    asegura estado de watchlist. Acelera los tests evitando pasar por la UI para el setup.
  - `webdriver.mjs` — el `AppiumBrowser` descrito arriba.
- **Runner**: usa el test runner nativo de Node (`node --test`), con
  `--test-concurrency=1` (un test a la vez). Script: `npm run test:e2e:appium`.

### Cómo se orquesta (`e2e-mobile.sh` + `docker-compose.mobile-e2e.yml`)

1. Levanta Postgres de test (`:15434`), `price-service` (`:18000`) y aplica migraciones Prisma.
2. Levanta backend (`:18080`) con `SPY_TICKERS=AAPL,MSFT,TSLA` y el `front-mobile` (`:15174`).
3. Espera a que haya precios base (AAPL/MSFT/TSLA).
4. Levanta el servidor Appium (`:4723`) si no está corriendo.
5. Corre los tests con variables:
   - `MOBILE_E2E_API_URL=http://localhost:18080` (API para el seeding por REST),
   - `MOBILE_E2E_BASE_URL=http://10.0.2.2:15174` (la IP especial del emulador Android para
     alcanzar el `localhost` del host).
6. Al terminar, baja Appium y el stack.

### Qué prueban (suites)

- **Auth**: registro y login exitosos (caen en `/app/dashboard`), email duplicado, password incorrecta.
- **Portfolio**: comprar hace aparecer la posición; vender todo la hace desaparecer; vender
  lo que no se tiene falla; las transacciones aparecen en la página de transacciones; comprar
  refleja la posición en el dashboard; el valor total de cuenta sube tras comprar más.
- **Stock**: navegación entre tabs (filings/métricas/etc.); comprar y vender desde la página
  de detalle del stock.
- **Watchlist**: agregar/quitar ticker; agregar desde el detalle del stock; comparar dos
  tickers y ver la tabla de métricas.

---

## 3. Locust (pruebas de carga y estrés)

Pruebas de performance del backend en `locust-testing/`. Hay **dos esquemas claramente
diferenciados**: **load** (carga sostenible) y **stress** (sobrecarga hasta el punto de
quiebre), más una matriz de límites de recursos.

### Estructura

| Archivo | Rol |
|---------|-----|
| `common.py` | Config compartida: base URL, pools de tickers (`HOT_TICKERS` 8, `COLD_TICKERS` 60, `ALL_TICKERS` 68), helpers register/login/me. |
| `workflows.py` | Los **3 flujos de comportamiento humano**: `ConversionFlow`, `ReadOnlyFlow`, `IntensiveTxnFlow`. |
| `load.py` | Esquema **load** — tráfico estable y sostenible. |
| `stress.py` | Esquema **stress** — sobrecarga en rampa + safeguard de rate-limit de EDGAR. |
| `run_scenarios.sh` | Corre la suite bajo varios límites CPU/mem, muestrea `docker stats` por contenedor. |
| `plot_results.py` | Convierte los CSVs en PNGs (por contenedor + Locust). |
| `results/` | Reportes HTML, CSVs y PNGs generados (un subdir por escenario). |

### Los 3 flujos (sesiones ordenadas, no requests aleatorios)

Cada "usuario virtual" se **registra una vez** (`on_start`) y **repite su flujo** durante
toda la prueba, manteniendo su propio estado (token, watchlist, holdings). Todos replican el
"costo del shell" del `AppLayout` (en cada página: `GET /prices`, `/prices/last-run`,
`/auth/me`), por eso **`GET /prices` es el endpoint más golpeado** — igual que en la UI real.

- **ConversionFlow** (equivalente a "conversión"): ver portfolio → abrir detalle de un stock
  (company + price + filings + metrics) → agregar a watchlist → volver → ver watchlist.
- **ReadOnlyFlow** (navegación/lectura, flujo para medir impacto de caché): solo lecturas;
  abre varios detalles de stock. El hit rate de la caché EDGAR es la variable clave aquí.
- **IntensiveTxnFlow** (transaccional intenso): abrir compra → comprar → recargar portfolio
  → ver ops del ticker → vender → recargar transacciones. Castiga el motor de transacciones
  (el replay FIFO crece durante la corrida), la validación de ticker contra EDGAR y la
  agregación del portfolio. Solo vende lo que compró.

### Load vs Stress

| Dimensión | **Load** | **Stress** |
|-----------|----------|------------|
| Objetivo | Confirmar salud bajo tráfico esperado | Encontrar el punto de quiebre y verificar falla elegante |
| Concurrencia | 100 usuarios constantes | Rampa 0 → 125 → 375 → **500** → recuperación (`LoadTestShape`) |
| Mix | ReadOnly 50% / Conversion 30% / Intensive 20% | ReadOnly 45% / Intensive 36% / Conversion 18% |
| Tickers | `HOT_TICKERS` (8) → alto cache hit | `ALL_TICKERS` (68) → más cache misses |
| Think time | `between(1,3)`s (realista) | `between(0,0.2)`s (martillar) |
| Guard EDGAR | no hace falta (dominan los hits) | token-bucket compartido, `EDGAR_UPSTREAM_RPS=8` |

### Safeguard del límite 10 req/s de EDGAR (exigido por la consigna)

El stress se mantiene bajo el límite de EDGAR **por diseño**, de dos formas:

1. **Caché de 24 h** del `EdgarService`: solo la *primera* request por clave llega a
   `data.sec.gov`. Con ~68 tickers, un cache frío produce a lo sumo unas decenas de llamadas
   upstream en toda la corrida, luego ~0.
2. **Token-bucket compartido explícito** (`EDGAR_UPSTREAM_RPS`, default 8): limita la tasa
   *agregada* de las llamadas EDGAR cache-missable entre **todos** los usuarios simulados.
   Cuando el bucket se vacía, el flujo cae a un ticker HOT ya cacheado, así la request se
   sirve de caché y nunca llega a la SEC.

El batch de precios (Yahoo, `POST /prices/update`) está **fuera de alcance** para carga
continua: corre una vez por invocación y no debe generar carga sostenida sobre Yahoo.

### Matriz de recursos

`run_scenarios.sh` reinicia el backend bajo varios envelopes CPU/memoria
(`baseline` 2CPU/2GB → `cpu1_mem1g` → `cpu05_mem512m` → `cpu025_mem256m`) aplicados con
`docker-compose.limits.yml`, muestrea `docker stats` por contenedor y deja cada escenario en
`results/<escenario>/`. `plot_results.py` genera PNGs por contenedor, por Locust y una
`comparison.png` cross-escenario para ver cómo límites más ajustados adelantan "la rodilla"
de la curva de latencia.

---

## 4. Cypress (E2E web)

Pruebas E2E del **frontend** web en `frontend/cypress/`. Estructura estándar de Cypress,
con algunos detalles propios a tener en cuenta:

### Config (`cypress.config.ts`)

- `baseUrl: http://localhost:5173`, specs en `cypress/e2e/**/*.cy.ts`.
- `video: false` y `screenshotOnRunFailure: false` (corridas más livianas, pensado para CI).

### Comandos custom (`cypress/support/commands.ts`) — lo "especial"

En lugar de manejar todo por la UI, los tests **siembran estado y autentican por la API**,
lo que los hace más rápidos y estables:

- `cy.loginAsUser()` — registra un usuario por `POST /api/auth/register` y mete el token
  directo en `localStorage` (`auth_token`), sin pasar por el form de login.
- `cy.getByTestId(id)` — selector por `[data-testid=...]`.
- `cy.fillLoginForm` / `cy.fillRegisterForm` — rellenan y envían los formularios.
- `cy.ensureInWatchlist(ticker)` / `cy.ensureNotInWatchlist(ticker)` — fijan estado de
  watchlist vía API (con el token de `localStorage`).
- `cy.visitDashboard / visitPortfolio / visitWatchlist / visitStock / visitTransactions` —
  navegan y esperan a que aparezca un selector "ancla" (ej. tabla *o* estado vacío), evitando
  flakiness por timing.
- `cy.selectCompareChips(...tickers)`, `cy.shouldHaveFieldErrors`, `cy.shouldHaveGlobalError`.
- `cy.resetDb()` — hace `POST /api/test/reset` (helper de reset; los tests usan emails únicos
  con `Date.now()` para aislarse, así que en la práctica rara vez hace falta resetear).

> Nota: la API se accede vía el prefijo `/api` (Vite proxea al backend). Los `data-testid` /
> `data-cy` del frontend son compartidos conceptualmente con los page objects de Appium, así
> que ambos sets de tests apuntan a los mismos selectores.

### Orquestación (`e2e.sh` + `docker-compose.e2e.yml`)

Levanta el stack completo, espera backend (`:8080`) y frontend (`:5173`) y corre
`npx cypress run`. Baja el stack al terminar.

### Qué prueban (specs)

Cubren las mismas funcionalidades que Appium, en web:

- **Auth**: registro, login, email duplicado, password incorrecta.
- **Portfolio**: comprar/vender, reflejo en portfolio/dashboard/transacciones, valor total
  de cuenta.
- **Stock**: navegación entre tabs, comprar/vender desde el detalle.
- **Watchlist**: agregar/quitar, agregar desde el stock, comparar tickers.

---

## 5. Funcionalidades (qué hace cada una)

| Funcionalidad | Qué hace |
|---------------|----------|
| **Registro / Login** | Crea cuenta o autentica. Emite un JWT (firmado con `JWT_SECRET`). Las passwords se hashean con **argon2id**. `GET /auth/me` valida la sesión. |
| **Borrar cuenta** | `DELETE /users/me` elimina la cuenta del usuario autenticado. |
| **Comprar acciones** | `POST /transactions/buy`. Valida el ticker contra EDGAR, toma el precio actual de `StockPrice` y registra una `Transaction` BUY. |
| **Vender acciones** | `POST /transactions/sell`. Valida que haya posición suficiente (no se puede vender más de lo que se tiene). Registra una `Transaction` SELL. |
| **Historial de transacciones** | `GET /transactions` (todas) y `GET /transactions/:ticker` (de un ticker). La UI tiene página de transacciones con filtros/stats. |
| **Portafolio** | `GET /portfolio`. Calcula posiciones abiertas reproduciendo todas las transacciones (costo promedio FIFO) y las cruza con precios actuales. Muestra P&L. Sin tabla propia. |
| **Dashboard** | Resumen del portafolio (filas por posición) y valor total de la cuenta. |
| **Precios en vivo** | Batch contra `price-service`/Yahoo. Seed del S&P 500 al arranque, refresco horario (cron) y `POST /prices/update` manual. `GET /prices` (lista, alimenta el ticker bar y los buscadores client-side), `GET /prices/:ticker`, `GET /prices/last-run`. Incluye cambio porcentual diario. |
| **Detalle de empresa (Stock)** | Página con datos de la empresa (EDGAR), precio actual, **filings** (`10-K`/`10-Q` con link al documento) y **métricas financieras** por trimestre (revenue, net income, EPS, total assets, total liabilities), más acciones rápidas de compra/venta. |
| **Búsqueda de empresas** | Los buscadores de la UI filtran la lista ya cargada de `/prices` en el cliente. (Existe `GET /edgar/search` full-text en el backend, pero no está cableado a la UI.) |
| **Watchlist** | Seguir hasta **20** empresas por usuario. `POST /watchlist` (valida ticker contra EDGAR, rechaza duplicados con 409 y lista llena con 422), `DELETE /watchlist/:ticker`, `GET /watchlist` (con precio y cambio diario). |
| **Comparar en watchlist** | `POST /watchlist/compare` — compara métricas financieras (4 trimestres) de varios tickers de la watchlist del usuario (valida pertenencia; usa `Promise.allSettled` para tolerar fallos parciales). |

---

## Apéndice: variables de entorno y comandos clave

**Backend** (`backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `PRICE_SERVICE_URL`.
Opcionales: `SPY_TICKERS`, `SEED_SPY_PRICES_ON_STARTUP`.

**Stack completo**: `docker compose up --build` (web `:5173`, API `:8080`).

**Tests:**
- Backend unit: `npm run test` · integración: `npm run test:int`.
- Cypress (web): `./e2e.sh` o `cd frontend && npx cypress run`.
- Appium (mobile): `./e2e-mobile.sh`.
- Locust: ver `locust-testing/README.md` (`load.py` / `stress.py` / `run_scenarios.sh`).

**Versionado**: Conventional Commits + `semantic-release` (`fix:` → patch, `feat:` → minor,
`feat!:`/`BREAKING CHANGE:` → major).