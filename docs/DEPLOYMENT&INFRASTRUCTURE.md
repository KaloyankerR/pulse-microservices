# Deployment & Infrastructure

## 🐳 **Docker Containerization**

### **Service Dockerfile Template**
```dockerfile
# Standard Node.js service
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "server.js"]
```

### **Multi-Stage Build (Production)**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage  
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

USER nodejs
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

---

## 🏗️ **Docker Compose Development**

### **Complete Stack**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_MULTIPLE_DATABASES: pulse_users,pulse_social,pulse_posts,pulse_events,pulse_notifications
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/create-multiple-databases.sh:/docker-entrypoint-initdb.d/create-multiple-databases.sh

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Microservices
  user-service:
    build: ./user-service
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pulse_users
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
      JWT_SECRET: dev_jwt_secret
    depends_on:
      - postgres
      - rabbitmq
    volumes:
      - ./user-service:/app
      - /app/node_modules

  social-service:
    build: ./social-service
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pulse_social
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
      USER_SERVICE_URL: http://user-service:3001
    depends_on:
      - postgres
      - rabbitmq
      - user-service

  post-service:
    build: ./post-service
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pulse_posts
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
      USER_SERVICE_URL: http://user-service:3001
    depends_on:
      - postgres
      - rabbitmq

  event-service:
    build: ./event-service
    ports:
      - "3004:3004"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pulse_events
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq

  messaging-service:
    build: ./messaging-service
    ports:
      - "3005:3005"
    environment:
      NODE_ENV: development
      MONGODB_URL: mongodb://admin:password@mongodb:27017/pulse_messaging?authSource=admin
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
    depends_on:
      - mongodb
      - rabbitmq

  notification-service:
    build: ./notification-service
    ports:
      - "3006:3006"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pulse_notifications
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq

  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      USER_SERVICE_URL: http://user-service:3001
      SOCIAL_SERVICE_URL: http://social-service:3002
      POST_SERVICE_URL: http://post-service:3003
      EVENT_SERVICE_URL: http://event-service:3004
      MESSAGING_SERVICE_URL: http://messaging-service:3005
      NOTIFICATION_SERVICE_URL: http://notification-service:3006
    depends_on:
      - user-service
      - social-service
      - post-service
      - event-service
      - messaging-service
      - notification-service

volumes:
  postgres_data:
  mongo_data:
  rabbitmq_data:

networks:
  default:
    name: pulse-network
```

---

## ⚖️ **Load Balancing & Scaling**

### **Nginx Load Balancer**
```nginx
# nginx.conf
upstream user-service {
    server user-service-1:3001;
    server user-service-2:3001;
    server user-service-3:3001;
}

upstream post-service {
    server post-service-1:3003;
    server post-service-2:3003;
    server post-service-3:3003;
    server post-service-4:3003;
    server post-service-5:3003;
}

server {
    listen 80;
    server_name api.pulse.local;

    location /api/users/ {
        proxy_pass http://user-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/posts/ {
        proxy_pass http://post-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### **Docker Compose Scaling**
```bash
# Scale individual services
docker-compose up -d --scale post-service=3
docker-compose up -d --scale messaging-service=2
docker-compose up -d --scale notification-service=2

# Check running instances
docker-compose ps
```

---

## ☸️ **Kubernetes Deployment**

### **Namespace & ConfigMap**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pulse-app

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pulse-config
  namespace: pulse-app
data:
  POSTGRES_HOST: "postgres"
  MONGODB_HOST: "mongodb"
  RABBITMQ_HOST: "rabbitmq"
  RABBITMQ_USER: "admin"
```

### **Service Deployment Template**
```yaml
# k8s/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: pulse-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: pulse/user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pulse-secrets
              key: user-db-url
        - name: RABBITMQ_URL
          valueFrom:
            configMapKeyRef:
              name: pulse-config
              key: RABBITMQ_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 15
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: pulse-app
spec:
  selector:
    app: user-service
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

### **Auto-scaling Configuration**
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: pulse-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 🔐 **Security & Configuration**

### **Secrets Management**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: pulse-secrets
  namespace: pulse-app
type: Opaque
data:
  # Base64 encoded values
  jwt-secret: bXlfc2VjcmV0X2tleQ==
  postgres-password: cGFzc3dvcmQ=
  rabbitmq-password: cGFzc3dvcmQ=
  mongodb-password: cGFzc3dvcmQ=
```

### **Environment-Specific Configuration**
```javascript
// config/index.js
const config = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password'
    },
    rabbitmq: {
      url: 'amqp://localhost:5672'
    }
  },
  
  production: {
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

---

## 📊 **Monitoring & Logging**

### **Health Checks**
```javascript
// health.js - Common health check module
const checkDatabase = async (db) => {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', component: 'database' };
  } catch (error) {
    return { status: 'unhealthy', component: 'database', error: error.message };
  }
};

const checkRabbitMQ = async (connection) => {
  try {
    if (connection && !connection._closed) {
      return { status: 'healthy', component: 'rabbitmq' };
    }
    throw new Error('Connection closed');
  } catch (error) {
    return { status: 'unhealthy', component: 'rabbitmq', error: error.message };
  }
};

// Health endpoint
app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(db),
    checkRabbitMQ(rabbitmqConnection)
  ]);
  
  const isHealthy = checks.every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: process.env.SERVICE_NAME,
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### **Centralized Logging**
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION 
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### **Request Correlation**
```javascript
// middleware/correlation.js
const { v4: uuidv4 } = require('uuid');

const correlationMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.set('x-correlation-id', correlationId);
  
  // Add to all logs in this request
  req.logger = logger.child({ correlationId });
  
  next();
};

module.exports = correlationMiddleware;
```

---

## 🚀 **Deployment Commands**

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/your-username/pulse-microservices.git
cd pulse-microservices

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Check service health
curl http://localhost:3000/health

# View logs
docker-compose logs -f user-service
docker-compose logs -f social-service

# Scale services
docker-compose up -d --scale post-service=3

# Stop environment
docker-compose down
```

### **Production Deployment**
```bash
# Build production images
docker build -t pulse/user-service:v1.0 ./user-service
docker build -t pulse/social-service:v1.0 ./social-service
# ... other services

# Push to registry
docker push pulse/user-service:v1.0

# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n pulse-app
kubectl get services -n pulse-app

# Scale services
kubectl scale deployment user-service --replicas=5 -n pulse-app

# Rolling update
kubectl set image deployment/user-service user-service=pulse/user-service:v1.1 -n pulse-app
```

### **Backup & Recovery**
```bash
# Database backup
kubectl exec -it postgres-0 -n pulse-app -- pg_dumpall -U postgres > backup.sql

# MongoDB backup
kubectl exec -it mongodb-0 -n pulse-app -- mongodump --archive > mongo-backup.archive

# Restore from backup
kubectl exec -i postgres-0 -n pulse-app -- psql -U postgres < backup.sql
```

---

## 📈 **Performance Tuning**

### **Resource Allocation**
```yaml
# Production resource limits
resources:
  requests:
    memory: "256Mi"    # Minimum guaranteed
    cpu: "250m"        # 0.25 CPU cores
  limits:
    memory: "512Mi"    # Maximum allowed
    cpu: "500m"        # 0.5 CPU cores
```

### **Database Connection Pooling**
```javascript
// database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

### **Caching Strategy**
```javascript
// Redis connection
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.attempt > 3) return undefined;
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, ttl, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```