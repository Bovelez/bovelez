"""plot_results.py — turn the CSVs from run_scenarios.sh into PNG graphs.

Per scenario dir results/<scenario>/ it reads docker_stats.csv (per-container
CPU%/mem over time) and <suite>_stats_history.csv (Locust RPS/latency/users),
and writes:
  results/<scenario>_containers.png   CPU% + memory per container vs time
  results/<scenario>_locust.png       users, RPS, failures/s, p50/p95 vs time
  results/comparison.png              peak p95 / RPS / backend-mem by scenario

Usage:  .venv/bin/python plot_results.py --suite stress
Stdlib csv + matplotlib only (no pandas).
"""

import argparse
import csv
import os
from collections import defaultdict

import matplotlib

matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt  # noqa: E402

BACKEND = "server"  # backend container_name in docker-compose


def read_csv(path):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def nums(rows, key):
    """Column as floats (missing/blank -> 0.0)."""
    out = []
    for r in rows:
        try:
            out.append(float(r.get(key, 0) or 0))
        except ValueError:
            out.append(0.0)
    return out


def plot_containers(sc_dir, scenario, out):
    path = os.path.join(sc_dir, "docker_stats.csv")
    if not os.path.exists(path):
        return
    rows = read_csv(path)
    if not rows:
        return
    t0 = min(float(r["timestamp"]) for r in rows)
    series = defaultdict(lambda: {"t": [], "cpu": [], "mem": []})
    for r in rows:
        s = series[r["container"]]
        s["t"].append(float(r["timestamp"]) - t0)
        s["cpu"].append(float(r["cpu_perc"] or 0))
        s["mem"].append(float(r["mem_used_mb"] or 0))

    fig, (ax_cpu, ax_mem) = plt.subplots(2, 1, figsize=(11, 8), sharex=True)
    for c, s in sorted(series.items()):
        ax_cpu.plot(s["t"], s["cpu"], label=c, linewidth=1.4)
        ax_mem.plot(s["t"], s["mem"], label=c, linewidth=1.4)
    ax_cpu.set(title=f"Per-container CPU — {scenario}", ylabel="CPU %")
    ax_mem.set(title="Per-container memory", ylabel="Memory (MB)",
               xlabel="Time since scenario start (s)")
    for ax in (ax_cpu, ax_mem):
        ax.grid(True, alpha=0.3)
        ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    fig.savefig(out, dpi=120)
    plt.close(fig)
    print(f"  wrote {out}")


def plot_locust(sc_dir, scenario, suite, out):
    path = os.path.join(sc_dir, f"{suite}_stats_history.csv")
    if not os.path.exists(path):
        return None
    # Keep the aggregated row (Locust labels it "Aggregated").
    rows = [r for r in read_csv(path) if r.get("Name") == "Aggregated"] or read_csv(path)
    if not rows:
        return None

    ts = nums(rows, "Timestamp")
    t0 = min(ts)
    t = [x - t0 for x in ts]
    users = nums(rows, "User Count")
    rps = nums(rows, "Requests/s")
    fps = nums(rows, "Failures/s")
    p50 = nums(rows, "50%")
    p95 = nums(rows, "95%")

    fig, ax = plt.subplots(3, 1, figsize=(11, 10), sharex=True)
    ax[0].plot(t, users, color="#444", label="users")
    ax[0].set(title=f"Locust {suite} — {scenario}", ylabel="Users")
    ax[1].plot(t, rps, color="#1f77b4", label="requests/s")
    ax[1].plot(t, fps, color="#d62728", label="failures/s")
    ax[1].set(ylabel="Throughput")
    ax[2].plot(t, p50, color="#2ca02c", label="p50 (ms)")
    ax[2].plot(t, p95, color="#ff7f0e", label="p95 (ms)")
    ax[2].set(ylabel="Latency (ms)", xlabel="Time since test start (s)")
    for a in ax:
        a.grid(True, alpha=0.3)
        a.legend(loc="upper left", fontsize=8)
    fig.tight_layout()
    fig.savefig(out, dpi=120)
    plt.close(fig)
    print(f"  wrote {out}")
    return {"scenario": scenario, "p95": max(p95, default=0), "rps": max(rps, default=0)}


def peak_backend_mem(sc_dir):
    path = os.path.join(sc_dir, "docker_stats.csv")
    if not os.path.exists(path):
        return 0
    mems = [float(r["mem_used_mb"] or 0) for r in read_csv(path) if r["container"] == BACKEND]
    return max(mems, default=0)


def plot_comparison(summaries, results_dir, out):
    summaries = [s for s in summaries if s]
    if not summaries:
        return
    names = [s["scenario"] for s in summaries]
    metrics = [
        ("Peak p95 latency", "ms", [s["p95"] for s in summaries], "#ff7f0e"),
        ("Peak requests/s", "req/s", [s["rps"] for s in summaries], "#1f77b4"),
        ("Peak backend memory", "MB",
         [peak_backend_mem(os.path.join(results_dir, s["scenario"])) for s in summaries],
         "#2ca02c"),
    ]
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    for ax, (title, ylabel, vals, color) in zip(axes, metrics):
        ax.bar(names, vals, color=color)
        ax.set(title=title, ylabel=ylabel)
        ax.grid(True, axis="y", alpha=0.3)
        ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(out, dpi=120)
    plt.close(fig)
    print(f"  wrote {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--suite", default="stress", choices=["stress", "load"])
    ap.add_argument("--results", default=os.path.join(os.path.dirname(__file__), "results"))
    args = ap.parse_args()

    scenarios = sorted(
        d for d in os.listdir(args.results)
        if os.path.isdir(os.path.join(args.results, d))
        and os.path.exists(os.path.join(args.results, d, "docker_stats.csv"))
    )
    if not scenarios:
        print(f"No scenario dirs under {args.results}. Run ./run_scenarios.sh first.")
        return

    print(f"Scenarios: {', '.join(scenarios)}")
    summaries = []
    for sc in scenarios:
        sc_dir = os.path.join(args.results, sc)
        print(f"[{sc}]")
        plot_containers(sc_dir, sc, os.path.join(args.results, f"{sc}_containers.png"))
        summaries.append(plot_locust(sc_dir, sc, args.suite,
                                     os.path.join(args.results, f"{sc}_locust.png")))
    plot_comparison(summaries, args.results, os.path.join(args.results, "comparison.png"))
    print("Done.")


if __name__ == "__main__":
    main()
