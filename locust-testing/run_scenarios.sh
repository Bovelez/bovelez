#!/usr/bin/env bash
#
# run_scenarios.sh — run the Locust stress (or load) suite against the backend
# under several CPU/memory envelopes, capturing per-container resource usage so
# we can produce per-container metrics and graphs afterwards (plot_results.py).
#
# For each scenario it: (1) restarts db + price-service + backend with the
# scenario's limits (docker-compose.limits.yml), (2) waits for the API, (3)
# samples `docker stats` into results/<scenario>/docker_stats.csv while (4)
# Locust runs into results/<scenario>/.
#
# Usage:
#   cd locust-testing
#   ./run_scenarios.sh                  # stress suite, all scenarios
#   SUITE=load ./run_scenarios.sh       # load suite instead
#   ./run_scenarios.sh baseline cpu05_mem512m   # only the named scenarios
#
# Requires: docker (compose v2) and the local .venv with locust installed.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
LOCUST="$HERE/.venv/bin/locust"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.limits.yml")

SUITE="${SUITE:-stress}"                 # stress | load
HOST="${HOST:-http://localhost:8080}"
LOAD_USERS="${LOAD_USERS:-100}"
LOAD_SPAWN="${LOAD_SPAWN:-10}"
LOAD_TIME="${LOAD_TIME:-3m}"
STATS_INTERVAL="${STATS_INTERVAL:-2}"    # docker stats sample period (s)
CONTAINERS="server price-service database"

# Scenarios: "name:BACKEND_CPUS:BACKEND_MEM:NODE_OPTIONS".
# NODE_OPTIONS pins the V8 heap below the memory cap so we OOM gracefully.
SCENARIOS=(
  "baseline:2.0:2g:"
  "cpu1_mem1g:1.0:1g:--max-old-space-size=768"
  "cpu05_mem512m:0.5:512m:--max-old-space-size=384"
  "cpu025_mem256m:0.25:256m:--max-old-space-size=192"
)

# Optional CLI filter: keep only scenarios named on the command line.
if [[ $# -gt 0 ]]; then
  filtered=()
  for s in "${SCENARIOS[@]}"; do
    for want in "$@"; do [[ "${s%%:*}" == "$want" ]] && filtered+=("$s"); done
  done
  SCENARIOS=("${filtered[@]}")
fi
[[ ${#SCENARIOS[@]} -eq 0 ]] && { echo "No matching scenarios."; exit 1; }

wait_for_api() {
  for _ in $(seq 1 60); do
    curl -fsS -o /dev/null "$HOST/prices/last-run" 2>/dev/null && return 0
    sleep 2
  done
  return 1
}

# Background sampler: one docker-stats snapshot per interval -> CSV.
# MemUsage like "180MiB / 2GiB" is normalised to MB by the awk helper.
sample_stats() {
  local out="$1"
  echo "timestamp,container,cpu_perc,mem_used_mb,mem_limit_mb,mem_perc" > "$out"
  while true; do
    docker stats --no-stream --format \
      '{{.Name}};{{.CPUPerc}};{{.MemUsage}};{{.MemPerc}}' $CONTAINERS 2>/dev/null \
    | awk -v ts="$(date +%s)" -F';' '
        function mb(s) {
          if (s ~ /GiB/) { sub(/GiB/,"",s); return s*1024 }
          if (s ~ /MiB/) { sub(/MiB/,"",s); return s }
          if (s ~ /KiB/) { sub(/KiB/,"",s); return s/1024 }
          if (s ~ /GB/)  { sub(/GB/,"",s);  return s*1000 }
          if (s ~ /MB/)  { sub(/MB/,"",s);  return s }
          if (s ~ /kB/)  { sub(/kB/,"",s);  return s/1000 }
          sub(/B/,"",s); return s/1e6
        }
        { split($3, m, "/"); cpu=$2; sub(/%/,"",cpu); mp=$4; sub(/%/,"",mp);
          print ts","$1","cpu","mb(m[1])","mb(m[2])","mp }' >> "$out"
    sleep "$STATS_INTERVAL"
  done
}

echo "Suite: $SUITE | host: $HOST | scenarios: ${SCENARIOS[*]%%:*}"

for entry in "${SCENARIOS[@]}"; do
  IFS=':' read -r name cpus mem node_opts <<<"$entry"
  outdir="$HERE/results/$name"; mkdir -p "$outdir"

  echo; echo "=== SCENARIO: $name (CPUS=$cpus MEM=$mem) ==="
  export BACKEND_CPUS="$cpus" BACKEND_MEM="$mem" BACKEND_NODE_OPTIONS="$node_opts"

  "${COMPOSE[@]}" up -d --build database price-service backend
  wait_for_api || { echo "  API not healthy, skipping $name"; continue; }

  sample_stats "$outdir/docker_stats.csv" & sampler=$!

  if [[ "$SUITE" == "stress" ]]; then
    BASE_URL="$HOST" "$LOCUST" -f "$HERE/stress.py" --headless \
      --host "$HOST" --html "$outdir/stress.html" --csv "$outdir/stress" || true
  else
    BASE_URL="$HOST" "$LOCUST" -f "$HERE/load.py" --headless \
      -u "$LOAD_USERS" -r "$LOAD_SPAWN" -t "$LOAD_TIME" \
      --host "$HOST" --html "$outdir/load.html" --csv "$outdir/load" || true
  fi

  kill "$sampler" 2>/dev/null || true; wait "$sampler" 2>/dev/null || true
  echo "  done -> $outdir"
done

echo; echo "Graphs: .venv/bin/python plot_results.py --suite $SUITE"
