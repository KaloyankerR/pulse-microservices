# Week 9 – Load Testing Automation

## Purpose

Establish repeatable load testing so operational decisions are backed by measurable data. The new automation integrates k6 scenarios into daily workflows and keeps the suite accessible to every contributor.

## Implementation

- Authored a comprehensive `load-tests/README.md` that documents prerequisites, scenarios, thresholds, and troubleshooting.
- Added root `Makefile` targets that wrap k6 commands, ensuring consistent execution and results storage.
- Ensured each scenario exercises all services through Kong, providing realistic gateway-level coverage.

```220:255:Makefile
load-test-create-user:
	@cd load-tests && ./scripts/create-test-user.sh
load-test-baseline:
	@k6 run --out json=load-tests/results/baseline-summary.json ...
load-test-all:
	@echo "✅ All load tests complete!"
```

## Operational Benefits

- **Ease of Use:** Developers can launch scenarios with `make load-test-*`, reducing ramp-up time.
- **Traceability:** Results automatically land in `load-tests/results/`, standardising evidence for regression analysis.
- **Safety:** Documentation captures conservative VU counts and remediation steps, helping the team avoid overloading local environments.

## Integration

- Linked the automation with the weekly plan and Kubernetes guide so operators can benchmark environments before and after deployments.
- Coordinated with auth changes to ensure load tests authenticate through the new `auth-service`.

## Reflection

Automating load testing moved performance validation from ad-hoc experiments to a sustainable practice. The foundation is solid, and I will continue to iterate toward higher concurrency and CI integration, aligning with a **Beginning** self-grade for this learning outcome.


