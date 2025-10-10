# SonarQube Integration Guide

This guide provides comprehensive instructions for using SonarQube code quality analysis across all Pulse microservices.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Running Analysis](#running-analysis)
5. [Viewing Results](#viewing-results)
6. [Configuration Details](#configuration-details)
7. [Troubleshooting](#troubleshooting)

## Overview

All Pulse microservices are integrated with a centralized SonarQube instance for code quality analysis, security vulnerabilities detection, code smells identification, and test coverage reporting.

### Integrated Services

- **user-service** (Node.js/JavaScript)
- **notification-service** (Node.js/JavaScript)
- **social-service** (Node.js/JavaScript)
- **post-service** (Go)
- **messaging-service** (Go)

## Prerequisites

### 1. SonarQube Server Running

Ensure SonarQube is running via Docker Compose:

```bash
docker-compose up -d sonarqube
```

Wait for SonarQube to be healthy (may take 1-2 minutes):

```bash
docker-compose logs -f sonarqube
```

SonarQube will be available at: **http://localhost:9001**

### 2. Install SonarQube Scanner

#### For Node.js Services

SonarQube scanner is already included as a dev dependency in all Node.js services.

#### For Go Services

Install SonarQube Scanner globally:

**macOS (via Homebrew):**
```bash
brew install sonar-scanner
```

**Linux:**
```bash
# Download and install
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
sudo mv sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

**Windows:**
- Download from: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
- Add to PATH

### 3. SonarQube Initial Setup

1. Open SonarQube at http://localhost:9001
2. Default credentials:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted
4. Generate an authentication token:
   - Go to: My Account → Security → Generate Tokens
   - Create a token for each service or use one global token
   - **Important:** Save the token securely

### 4. Update Project Tokens (Optional)

If you want to use authentication tokens (recommended for production):

Update the `sonar-project.properties` file in each service with your token:

```properties
sonar.token=your-token-here
```

Or set it as an environment variable:

```bash
export SONAR_TOKEN=your-token-here
```

## Quick Start

### Run Analysis for All Services

```bash
make sonar-all
```

This will:
1. Run tests with coverage for all services
2. Execute SonarQube analysis for each service
3. Upload results to the centralized SonarQube instance

### Run Analysis for Individual Services

```bash
# User Service
make sonar-user

# Notification Service
make sonar-notification

# Social Service
make sonar-social

# Post Service (Go)
make sonar-post

# Messaging Service (Go)
make sonar-messaging
```

## Running Analysis

### Detailed Steps

#### Node.js Services (user, notification, social)

```bash
cd <service-directory>

# Run tests with coverage
npm run test:coverage

# Run SonarQube analysis
npm run sonar
```

#### Go Services (post, messaging)

```bash
cd <service-directory>

# Run tests with coverage
go test ./... -coverprofile=coverage.out

# Run SonarQube analysis
sonar-scanner
```

### What Happens During Analysis

1. **Test Execution**: Unit tests run with coverage reporting
2. **Coverage Generation**: 
   - Node.js: `coverage/lcov.info`
   - Go: `coverage.out`
3. **Code Analysis**: SonarQube Scanner analyzes source code
4. **Report Upload**: Results sent to SonarQube server
5. **Dashboard Update**: SonarQube dashboard updates with new metrics

## Viewing Results

### Access SonarQube Dashboard

1. Open browser to: **http://localhost:9001**
2. Login with your credentials
3. View all projects on the main dashboard

### Understanding the Dashboard

#### Projects Overview

You'll see all 5 microservices listed:

- `pulse-user-service`
- `pulse-notification-service`
- `pulse-social-service`
- `pulse-post-service`
- `pulse-messaging-service`

#### Key Metrics for Each Project

- **Bugs**: Potential runtime errors
- **Vulnerabilities**: Security issues
- **Code Smells**: Maintainability issues
- **Coverage**: Test coverage percentage
- **Duplications**: Duplicate code blocks
- **Maintainability Rating**: A-E scale
- **Reliability Rating**: A-E scale
- **Security Rating**: A-E scale

#### Quality Gate

Each project shows PASSED or FAILED based on configured quality gates.

### Drill Down into Issues

1. Click on a project name
2. Navigate to:
   - **Issues**: Browse all detected issues
   - **Measures**: View detailed metrics
   - **Code**: View source code with inline annotations
   - **Activity**: Historical analysis results

## Configuration Details

### Project Structure

Each service has a `sonar-project.properties` file:

#### Node.js Services

```
service-name/
├── src/                          # Source code
├── tests/                        # Test files
├── coverage/                     # Coverage reports
│   └── lcov.info                # Coverage data
├── sonar-project.properties     # SonarQube config
└── package.json                 # Includes sonar script
```

#### Go Services

```
service-name/
├── cmd/                          # Main applications
├── internal/                     # Internal packages
├── coverage.out                  # Coverage data (generated)
└── sonar-project.properties     # SonarQube config
```

### Configuration Files

#### user-service/sonar-project.properties
```properties
sonar.projectKey=pulse-user-service
sonar.projectName=Pulse User Service
sonar.projectVersion=1.0.0
sonar.sources=src
sonar.tests=tests
sonar.host.url=http://localhost:9001
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/coverage/**,**/*.test.js
```

#### post-service/sonar-project.properties
```properties
sonar.projectKey=pulse-post-service
sonar.projectName=Pulse Post Service
sonar.projectVersion=1.0.0
sonar.sources=.
sonar.host.url=http://localhost:9001
sonar.language=go
sonar.go.coverage.reportPaths=coverage.out
sonar.exclusions=**/*_test.go,**/vendor/**,**/bin/**
```

### Customizing Analysis

#### Exclude Additional Paths

Add to `sonar.exclusions` in `sonar-project.properties`:

```properties
sonar.exclusions=**/node_modules/**,**/build/**,**/dist/**
```

#### Change Coverage Threshold

Modify quality gates in SonarQube UI:
1. Go to Quality Gates
2. Edit or create a new gate
3. Add condition for coverage percentage

#### Add Custom Rules

1. Go to Rules in SonarQube
2. Activate/Deactivate rules
3. Create custom rule sets

## Troubleshooting

### Common Issues

#### 1. SonarQube Not Accessible

**Problem**: Cannot access http://localhost:9001

**Solution**:
```bash
# Check if SonarQube is running
docker-compose ps sonarqube

# View logs
docker-compose logs sonarqube

# Restart SonarQube
docker-compose restart sonarqube
```

#### 2. Scanner Not Found (Go Services)

**Problem**: `sonar-scanner: command not found`

**Solution**:
```bash
# Install sonar-scanner
brew install sonar-scanner

# Verify installation
sonar-scanner --version
```

#### 3. Authentication Failed

**Problem**: Authentication error during analysis

**Solution**:
```bash
# Generate new token in SonarQube UI
# Update sonar-project.properties or set environment variable
export SONAR_TOKEN=your-new-token
```

#### 4. Coverage Report Not Found

**Problem**: SonarQube shows 0% coverage

**Solution for Node.js**:
```bash
# Ensure coverage is generated
npm run test:coverage

# Verify coverage/lcov.info exists
ls -la coverage/lcov.info
```

**Solution for Go**:
```bash
# Generate coverage file
go test ./... -coverprofile=coverage.out

# Verify coverage.out exists
ls -la coverage.out
```

#### 5. Project Already Exists

**Problem**: Project key already exists error

**Solution**:
- Delete the old project in SonarQube UI
- Or update `sonar.projectKey` to a unique value

#### 6. Analysis Takes Too Long

**Problem**: Analysis hangs or takes excessive time

**Solution**:
```bash
# Check SonarQube container resources
docker stats sonarqube

# Increase memory if needed (docker-compose.yml)
# Add memory limits and ensure sufficient resources
```

### Debug Mode

Run analysis with verbose output:

**Node.js**:
```bash
cd <service>
npm run sonar -- -X
```

**Go**:
```bash
cd <service>
sonar-scanner -X
```

## Best Practices

### 1. Run Analysis Before Pull Requests

```bash
# Before creating PR
make sonar-all
```

Review and fix issues before merging.

### 2. Set Up Quality Gates

Configure quality gates to enforce:
- Minimum test coverage (e.g., 80%)
- Maximum number of bugs (e.g., 0)
- Maximum technical debt ratio

### 3. Regular Analysis

Run analysis regularly:
- On every commit (CI/CD)
- Daily scheduled runs
- Before releases

### 4. Monitor Trends

Track metrics over time:
- Code coverage trends
- New vs. fixed issues
- Technical debt evolution

### 5. Fix Issues Incrementally

Prioritize:
1. **Security vulnerabilities** (Critical)
2. **Bugs** (High)
3. **Code smells** (Medium)
4. **Duplications** (Low)

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/sonarqube.yml`:

```yaml
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run SonarQube Analysis
        run: |
          make sonar-all
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Additional Resources

- [SonarQube Documentation](https://docs.sonarqube.org/latest/)
- [SonarScanner for JavaScript](https://docs.sonarqube.org/latest/analysis/languages/javascript/)
- [SonarScanner for Go](https://docs.sonarqube.org/latest/analysis/languages/go/)
- [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
- [Security Reports](https://docs.sonarqube.org/latest/user-guide/security-reports/)

## Support

For issues or questions:
1. Check SonarQube logs: `docker-compose logs sonarqube`
2. Review service-specific logs during analysis
3. Consult SonarQube documentation
4. Contact the development team

---

**Last Updated**: October 2025  
**Maintained by**: Pulse Development Team

