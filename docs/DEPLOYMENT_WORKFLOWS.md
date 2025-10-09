# Deployment Workflows - Visual Guide

## Overview

This document provides a visual guide to the Docker Hub deployment workflows for the Pulse microservices platform.

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Actions                             │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
    ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
    │Pull Request│      │Push to main│      │  Git Tag   │
    │            │      │            │      │            │
    │  Testing   │      │  Deploy    │      │  Release   │
    │   Only     │      │   Auto     │      │  Version   │
    └─────┬──────┘      └─────┬──────┘      └─────┬──────┘
          │                    │                    │
          │                    │                    │
┌─────────▼────────────────────▼────────────────────▼─────────────────┐
│                     GitHub Actions Trigger                           │
└──────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
    ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
    │   CI Job   │      │   CI Job   │      │Deploy Job  │
    │  (No Push) │      │ (w/ Push)  │      │ (Release)  │
    └─────┬──────┘      └─────┬──────┘      └─────┬──────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌─────────────────────────────────────────────────────┐
    │              Build & Test Pipeline                   │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
    │  │  Build   │→│   Test   │→│  Docker  │            │
    │  │  Source  │ │  Service │ │  Build   │            │
    │  └──────────┘ └──────────┘ └──────────┘            │
    └─────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
          │                    ▼                    ▼
          │            ┌──────────────────────────────────┐
          │            │       Docker Hub Push            │
          │            │  • latest                        │
          │            │  • <commit-sha> or <version>     │
          │            └──────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌─────────────────────────────────────────────────────┐
    │              Deployment Complete                     │
    │  ✅ Tests Passed                                     │
    │  ✅ Images Available (if applicable)                 │
    │  ✅ Ready for Use                                    │
    └─────────────────────────────────────────────────────┘
```

## Deployment Paths

### Path 1: Pull Request (Development)

```
Developer → Create PR → GitHub Actions
                           │
                           ├─► Test Node Services
                           ├─► Test Go Services
                           ├─► Security Scan
                           └─► Docker Build (no push)
                                 │
                                 ▼
                           PR Comment with Status
```

**Result**: Tests run, feedback provided, no deployment

### Path 2: Push to Main (Continuous Deployment)

```
Developer → Merge PR → Push to main → GitHub Actions
                                          │
                                          ├─► Run All Tests
                                          │     │
                                          │     ├─► PASS ✅
                                          │     │     │
                                          │     │     ▼
                                          │     │   Build Images
                                          │     │     │
                                          │     │     ▼
                                          │     │   Push to Docker Hub
                                          │     │     │
                                          │     │     ├─► user-service:latest
                                          │     │     ├─► user-service:a1b2c3d
                                          │     │     ├─► messaging-service:latest
                                          │     │     └─► ... (all services)
                                          │     │
                                          │     └─► FAIL ❌
                                          │           │
                                          │           └─► No deployment
                                          │
                                          └─► Notification sent
```

**Result**: If tests pass, all services deployed with `latest` and commit SHA tags

### Path 3: Version Release (Tag-Based)

#### Full Release (all services)

```
Developer → Create tag v1.0.0 → Push tag → GitHub Actions
                                               │
                                               ├─► Detect version tag
                                               ├─► Build all services
                                               │     │
                                               │     ├─► Multi-platform
                                               │     │   (AMD64 + ARM64)
                                               │     │
                                               │     └─► Push to Docker Hub
                                               │           │
                                               │           ├─► user-service:1.0.0
                                               │           ├─► user-service:latest
                                               │           ├─► messaging-service:1.0.0
                                               │           ├─► messaging-service:latest
                                               │           └─► ... (all services)
                                               │
                                               └─► Deployment summary
```

**Result**: All services deployed with version tag and latest

#### Service-Specific Release

```
Developer → Create tag user-service-v1.2.3 → Push tag → GitHub Actions
                                                            │
                                                            ├─► Parse service name
                                                            ├─► Build user-service only
                                                            │     │
                                                            │     └─► Multi-platform build
                                                            │
                                                            └─► Push to Docker Hub
                                                                  │
                                                                  ├─► user-service:1.2.3
                                                                  └─► user-service:latest
```

**Result**: Only specified service deployed with version tag

### Path 4: Manual Deployment

```
Developer → GitHub UI → Actions Tab → Deploy to Docker Hub
                          │
                          ├─► Select service (all or specific)
                          ├─► Select environment (staging/production)
                          └─► Run workflow
                                │
                                ├─► Build selected services
                                │     │
                                │     └─► Multi-platform builds
                                │
                                └─► Push to Docker Hub
                                      │
                                      └─► Images with latest + SHA tags
```

**Result**: Selected services deployed on-demand

## Service Matrix

```
┌────────────────────────────────────────────────────────────────┐
│                      Service Matrix                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Node.js     │  │ Node.js     │  │   Node.js   │           │
│  │ user-       │  │ social-     │  │notification-│           │
│  │ service     │  │ service     │  │  service    │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                    │
│         ├── Prisma       ├── Prisma       ├── Mongoose        │
│         ├── PostgreSQL   ├── PostgreSQL   ├── MongoDB         │
│         └── Redis        └── Redis        ├── Redis           │
│                                           └── RabbitMQ         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │     Go      │  │     Go      │                             │
│  │ messaging-  │  │   post-     │                             │
│  │  service    │  │  service    │                             │
│  └──────┬──────┘  └──────┬──────┘                             │
│         │                │                                     │
│         ├── PostgreSQL   ├── PostgreSQL                        │
│         ├── Redis        └── Redis                             │
│         └── RabbitMQ                                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
             │                          │
             │                          │
             ▼                          ▼
    ┌─────────────────┐       ┌─────────────────┐
    │  Docker Build   │       │  Docker Build   │
    │  Node:18-alpine │       │  Golang:1.21    │
    └─────────────────┘       └─────────────────┘
             │                          │
             └────────────┬─────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Docker Hub    │
                 │                 │
                 │  5 Repositories │
                 └─────────────────┘
```

## Tagging Strategy Matrix

| Trigger Event | Tag Pattern | Services | Example Tags | Use Case |
|--------------|-------------|----------|--------------|----------|
| PR to main | None | All | N/A (no push) | Testing |
| Push to main | `latest`, `<sha>` | All | `latest`, `a1b2c3d` | Continuous deployment |
| Tag `v1.0.0` | `<version>`, `latest` | All | `1.0.0`, `latest` | Full release |
| Tag `user-service-v1.2.3` | `<version>`, `latest` | One | `1.2.3`, `latest` | Service hotfix |
| Manual (all) | `latest`, `<sha>` | All | `latest`, `a1b2c3d` | On-demand deployment |
| Manual (specific) | `latest`, `<sha>` | One | `latest`, `a1b2c3d` | On-demand single service |

## Image Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                     Image Lifecycle                             │
└────────────────────────────────────────────────────────────────┘

1. Development
   ├─► Local builds
   ├─► Feature branches
   └─► Pull requests (CI only)

2. Staging
   ├─► Push to main
   ├─► Auto-deploy with latest tag
   └─► Commit SHA for traceability

3. Release Candidate
   ├─► Version tag (e.g., v1.0.0-rc1)
   ├─► Full platform testing
   └─► Staging environment validation

4. Production
   ├─► Stable version tag (e.g., v1.0.0)
   ├─► Multi-platform builds
   └─► Latest tag updated

5. Maintenance
   ├─► Hotfix tags (e.g., user-service-v1.0.1)
   ├─► Security patches
   └─► Quick deployments

6. Archive
   ├─► Old versions retained
   ├─► Rollback capability
   └─► Historical reference
```

## Platform Support

```
┌────────────────────────────────────────────────────────────────┐
│              Multi-Platform Architecture                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Docker Buildx with QEMU                                        │
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │     AMD64/x86_64    │      │      ARM64/aarch64  │         │
│  │                     │      │                     │         │
│  │  • Intel processors │      │  • Apple Silicon    │         │
│  │  • AMD processors   │      │  • AWS Graviton     │         │
│  │  • Most cloud VMs   │      │  • Raspberry Pi 4+  │         │
│  │  • Desktop/Laptop   │      │  • Mobile devices   │         │
│  └─────────────────────┘      └─────────────────────┘         │
│            │                              │                     │
│            └──────────────┬───────────────┘                     │
│                           │                                     │
│                    Same Image Tag                               │
│                    (Manifest list)                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Deployment Timeline

```
┌────────────────────────────────────────────────────────────────┐
│                   Typical Deployment Timeline                   │
└────────────────────────────────────────────────────────────────┘

00:00  Developer merges PR to main
       │
00:01  ├─► GitHub Actions triggered
       │   ├─► Checkout code
       │   └─► Setup build environment
       │
00:02  ├─► Start matrix jobs (parallel)
       │   ├─► Test user-service
       │   ├─► Test social-service
       │   ├─► Test messaging-service
       │   └─► Test post-service
       │
00:05  ├─► All tests complete ✅
       │   └─► Tests passed
       │
00:06  ├─► Docker builds start (parallel)
       │   ├─► Build user-service
       │   ├─► Build social-service
       │   ├─► Build messaging-service
       │   └─► Build post-service
       │
00:10  ├─► Builds complete
       │   └─► Push to Docker Hub (parallel)
       │
00:11  ├─► Images available on Docker Hub
       │   ├─► pulse-user-service:latest
       │   ├─► pulse-user-service:a1b2c3d
       │   └─► ... (all services)
       │
00:12  └─► Deployment complete ✅
           └─► Notification sent

Total time: ~12 minutes
```

## Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                     Security Pipeline                           │
└────────────────────────────────────────────────────────────────┘

Code → GitHub Repository
  │
  ├─► GitHub Secrets (encrypted)
  │   ├─► DOCKERHUB_USERNAME
  │   └─► DOCKERHUB_TOKEN
  │
  ├─► GitHub Actions Runner
  │   ├─► Secure environment
  │   ├─► Isolated execution
  │   └─► No persistent storage
  │
  ├─► Docker Hub Authentication
  │   ├─► Token-based (not password)
  │   ├─► Scoped permissions
  │   └─► Auditable
  │
  ├─► Image Scanning (optional)
  │   ├─► Vulnerability detection
  │   ├─► Dependency check
  │   └─► Security report
  │
  └─► Docker Hub Registry
      ├─► Signed manifests
      ├─► Layer checksums
      └─► Tamper detection
```

## Monitoring & Observability

```
┌────────────────────────────────────────────────────────────────┐
│              Deployment Monitoring Points                       │
└────────────────────────────────────────────────────────────────┘

GitHub Actions
  │
  ├─► Workflow Status
  │   ├─► Success/Failure metrics
  │   ├─► Build duration
  │   └─► Resource usage
  │
  ├─► Build Logs
  │   ├─► Real-time streaming
  │   ├─► Error messages
  │   └─► Debug information
  │
  └─► Deployment Summary
      ├─► Services deployed
      ├─► Image tags created
      └─► Docker Hub URLs

Docker Hub
  │
  ├─► Repository Activity
  │   ├─► Push timestamps
  │   ├─► Tag history
  │   └─► Pull statistics
  │
  ├─► Image Metrics
  │   ├─► Image size
  │   ├─► Layer count
  │   └─► Platform support
  │
  └─► Access Logs
      ├─► Who pushed/pulled
      ├─► When accessed
      └─► From where
```

## Quick Reference

### Deployment Commands

```bash
# Automatic deployment
git push origin main

# Version release (all services)
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Service-specific release
git tag -a user-service-v1.2.3 -m "User service v1.2.3"
git push origin user-service-v1.2.3

# Pull images
docker pull username/pulse-user-service:latest
docker pull username/pulse-user-service:1.0.0

# Use in docker-compose
docker-compose -f docker-compose.dockerhub.yml up -d
```

### Status Check Commands

```bash
# View workflow runs
gh run list --workflow=docker-deploy.yml

# View specific run
gh run view <run-id>

# Check image on Docker Hub
docker manifest inspect username/pulse-user-service:latest

# Verify multi-platform support
docker buildx imagetools inspect username/pulse-user-service:latest
```

## Summary

This deployment system provides:

✅ **Automated CI/CD** - From code to deployment
✅ **Flexible Options** - Auto, manual, or version-based
✅ **Multi-Platform** - AMD64 and ARM64 support
✅ **Version Control** - Semantic versioning and tagging
✅ **Fast Deployments** - Parallel builds and pushes
✅ **Easy Rollbacks** - All versions retained
✅ **Comprehensive Monitoring** - Full visibility

The workflows are production-ready and follow industry best practices for containerized microservices deployment.

