# SonarQube Quick Start Guide

Quick reference for running SonarQube analysis on Pulse microservices.

## Prerequisites

1. **Start SonarQube**:
   ```bash
   docker-compose up -d sonarqube
   ```

2. **Install sonar-scanner** (for Go services):
   ```bash
   brew install sonar-scanner  # macOS
   ```

3. **Access SonarQube**: http://localhost:9001
   - Default login: `admin` / `admin`

## Run Analysis

### All Services at Once
```bash
make sonar-all
```

### Individual Services
```bash
make sonar-user          # User Service
make sonar-notification  # Notification Service  
make sonar-social        # Social Service
make sonar-post          # Post Service
make sonar-messaging     # Messaging Service
```

## View Results

Open http://localhost:9001 and see all 5 projects:
- `pulse-user-service`
- `pulse-notification-service`
- `pulse-social-service`
- `pulse-post-service`
- `pulse-messaging-service`

## What Gets Analyzed

✅ Code Quality & Complexity  
✅ Security Vulnerabilities  
✅ Code Smells  
✅ Test Coverage  
✅ Duplicate Code  
✅ Technical Debt  

## Troubleshooting

**SonarQube not accessible?**
```bash
docker-compose logs sonarqube
docker-compose restart sonarqube
```

**Coverage at 0%?**
```bash
# Node.js services
cd <service> && npm run test:coverage

# Go services  
cd <service> && go test ./... -coverprofile=coverage.out
```

**Scanner not found?**
```bash
brew install sonar-scanner
```

## More Information

See [docs/SONARQUBE_SETUP.md](docs/SONARQUBE_SETUP.md) for detailed documentation.

