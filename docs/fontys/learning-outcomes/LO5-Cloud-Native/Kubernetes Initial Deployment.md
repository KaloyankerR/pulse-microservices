# Week 9 – Kubernetes Baseline Deployment

## Goal

Bootstrap a Kubernetes deployment path for the Pulse platform so environments can transition from Docker Compose to cloud-native orchestration with minimal friction.

## Deliverables

- Authored `k8s/KUBERNETES_MIGRATION_GUIDE.md`, covering Minikube setup, image builds, namespace provisioning, monitoring stack, and cleanup steps.
- Added `Makefile` helpers (`k8s-start`, `k8s-build`, `k8s-deploy`, `k8s-status`, `k8s-port-forward`) to script common operational tasks.
- Ensured manifests exist for databases, microservices, Kong gateway, frontend, monitoring stack, and ingress resources.

```351:398:Makefile
k8s-start:
	@minikube start --memory=4096 --cpus=2 || true
k8s-deploy:
	@kubectl apply -f k8s/namespaces/ && \
	kubectl apply -f k8s/secrets/ && \
	kubectl apply -f k8s/configmaps/ && \
	kubectl apply -f k8s/databases/ && \
	kubectl apply -f k8s/services/ && \
	kubectl apply -f k8s/gateway/ && \
	kubectl apply -f k8s/frontend/ && \
	kubectl apply -f k8s/monitoring/ && \
	kubectl apply -f k8s/ingress/ || true
```

## Cloud-Native Alignment

- Adopted namespace scoping, declarative manifests, and monitoring add-ons that mirror production-style clusters.
- Documented port-forwarding, NodePort, and ingress options for local access, easing parity with managed Kubernetes services.
- Encouraged container image builds within the Minikube Docker daemon to avoid registry dependencies during experimentation.

## Impact

- Provides a tested pathway from local development to Kubernetes, accelerating future scaling and deployment strategies.
- Sets expectations for future enhancements such as secrets management, autoscaling, and environment-specific overlays.

## Reflection

Establishing the baseline highlighted how documentation and automation underpin cloud-native readiness. Further work on resilience (HPA, readiness probes, secrets) will move this outcome toward higher proficiency, aligning with the current **Beginning** self-assessment.


