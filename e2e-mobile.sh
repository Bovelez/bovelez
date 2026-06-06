#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -p bovelez-mobile-e2e -f $ROOT_DIR/docker-compose.mobile-e2e.yml"
APPIUM_SERVER_URL="${APPIUM_SERVER_URL:-http://127.0.0.1:4723}"
APPIUM_PID=""
WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-120}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin:$PATH"

cleanup() {
  echo ""
  if [ -n "$APPIUM_PID" ]; then
    echo ">>> Bajando Appium..."
    kill "$APPIUM_PID" > /dev/null 2>&1 || true
  fi
  echo ">>> Bajando stack mobile e2e..."
  $COMPOSE down -v
}
trap cleanup EXIT

wait_for_url() {
  local label="$1"
  local url="$2"
  local start
  start="$(date +%s)"

  until curl -sf "$url" > /dev/null 2>&1; do
    if [ $(( $(date +%s) - start )) -ge "$WAIT_TIMEOUT_SECONDS" ]; then
      echo "ERROR: Timeout esperando $label en $url después de ${WAIT_TIMEOUT_SECONDS}s"
      return 1
    fi
    sleep 2
  done
}

wait_for_price() {
  local ticker="$1"
  wait_for_url "precio $ticker" "http://localhost:18080/prices/$ticker"
}

echo ">>> Levantando DB y servicios base mobile e2e..."
$COMPOSE up -d --build e2e-db price-service

echo ">>> Aplicando migraciones Prisma sobre la DB mobile e2e..."
$COMPOSE run --rm backend npx prisma migrate deploy

echo ">>> Levantando backend y front-mobile mobile e2e..."
$COMPOSE up -d --build backend front-mobile

echo ">>> Esperando backend mobile e2e en :18080..."
wait_for_url "backend mobile e2e" "http://localhost:18080/prices"
echo ">>> Backend mobile e2e listo."

echo ">>> Esperando precios base mobile e2e..."
wait_for_price "AAPL"
wait_for_price "MSFT"
wait_for_price "TSLA"
echo ">>> Precios base mobile e2e listos."

echo ">>> Esperando front-mobile en :15174..."
wait_for_url "front-mobile" "http://localhost:15174"
echo ">>> Front-mobile listo."

if curl -sf "$APPIUM_SERVER_URL/status" > /dev/null 2>&1; then
  echo ">>> Appium ya está corriendo en $APPIUM_SERVER_URL."
else
  echo ">>> Levantando Appium en $APPIUM_SERVER_URL..."
  cd "$ROOT_DIR/front-mobile"
  npm run appium:server > "$ROOT_DIR/.appium-mobile-e2e.log" 2>&1 &
  APPIUM_PID=$!

  wait_for_url "Appium" "$APPIUM_SERVER_URL/status"
  echo ">>> Appium listo."
fi

echo ">>> Corriendo tests Appium mobile..."
cd "$ROOT_DIR/front-mobile"
if [ "$#" -gt 0 ]; then
  APPIUM_SERVER_URL="$APPIUM_SERVER_URL" \
  MOBILE_E2E_API_URL=http://localhost:18080 \
  MOBILE_E2E_BASE_URL=http://10.0.2.2:15174 \
  node --test --test-concurrency=1 "$@"
else
  APPIUM_SERVER_URL="$APPIUM_SERVER_URL" \
  MOBILE_E2E_API_URL=http://localhost:18080 \
  MOBILE_E2E_BASE_URL=http://10.0.2.2:15174 \
  npm run test:e2e:appium
fi
