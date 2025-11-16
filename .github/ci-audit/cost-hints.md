# CI Cost Hints for Heaney-Investments/stamp-collection-intelligence

Failed runs (window): 151

## Longest failing jobs (minutes)
-   0.82m  Run Tests  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19227781476
-   0.77m  Run Tests  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19227776146
-   0.52m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19122858288
-    0.5m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19318540514
-   0.48m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19186570792
-   0.48m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19022184177
-   0.47m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19284410078
-   0.45m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19399064780
-   0.45m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19227781491
-   0.45m  Security Audit  labels=['ubuntu-latest']  run=https://github.com/Heaney-Investments/stamp-collection-intelligence/actions/runs/19202074724

## Recommendations
- Add concurrency + cancel-in-progress to long-lived workflows (prevents duplicate runs)
- Add on:push paths filters to skip docs-only or non-code changes
- Consider scheduled workflows cadence (weekly/monthly instead of daily)
- Increase cache hit rates (setup-node/setup-python + actions/cache with lockfiles)
- Timeouts: set step/job-level timeouts to prevent runaway costs
- Reduce matrix size or shard by priority (nightly full matrix, PRs minimal)
