#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.e2e.yml"

# ── Teardown on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo ">>> Bajando stack e2e..."
  $COMPOSE down
}
trap cleanup EXIT

# ── Levantar stack ────────────────────────────────────────────────────────────
echo ">>> Levantando stack e2e..."
$COMPOSE up -d --build

# ── Esperar migraciones (el backend corre db:apply al iniciar) ────────────────
echo ">>> Esperando que el backend esté listo en :8080..."
until curl -sf http://localhost:8080/test/health > /dev/null 2>&1; do
  sleep 2
done
echo ">>> Backend listo."

# ── Esperar frontend ──────────────────────────────────────────────────────────
echo ">>> Esperando frontend en :5173..."
until curl -sf http://localhost:5173 > /dev/null 2>&1; do
  sleep 2
done
echo ">>> Frontend listo."

# ── Correr Cypress ────────────────────────────────────────────────────────────
echo ">>> Corriendo tests Cypress..."
cd frontend
npx cypress run "$@"
