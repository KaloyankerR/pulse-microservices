# Pulse - Project Structure

## 📁 Clean, Organized Structure

This project has been cleaned up and organized for easy development and deployment.

### 🐳 **Docker Setup (Simple & Clean)**

```
docker-compose.yml    # Single Docker compose file
docker.env           # Environment configuration
Dockerfile           # Optimized multi-stage build
```

### 🚀 **Quick Start**

```bash
npm run docker:start
```

Then open: http://localhost:3000

### 📋 **Core Application Files**

```
components/          # React components
├── shared/         # Reusable UI components
├── modals/         # Modal components
├── posts/          # Post-related components
├── events/         # Event-related components
├── chat/           # Chat functionality
└── ...

pages/              # Next.js pages and API routes
├── api/           # Backend API endpoints
├── users/         # User profile pages
├── posts/         # Post detail pages
└── ...

hooks/              # Custom React hooks
libs/               # Utility libraries
types/              # TypeScript type definitions
utils/              # Helper functions
```

### ⚙️ **Configuration**

```
next.config.js       # Next.js configuration
tailwind.config.js   # Tailwind CSS configuration
postcss.config.js    # PostCSS configuration
tsconfig.json        # TypeScript configuration
```

### 📚 **Documentation**

```
README.md            # Main project documentation
DOCKER_SETUP.md      # Docker setup guide
docs/                # Technical documentation
├── LICENSE         # MIT License
└── markdown/       # Detailed feature docs
```

### 🗃️ **Database & Styling**

```
prisma/              # Database schema and migrations
styles/              # Global CSS styles
public/              # Static assets
```

## 🎯 **What Was Cleaned Up**

### ❌ **Removed Files:**

- Duplicate Docker configurations
- Load testing files and scripts
- Performance testing files
- Development artifacts
- Unnecessary config files
- Fake database files

### ✅ **Kept Essential Files:**

- Clean Docker setup
- Core application code
- Essential configuration
- Documentation
- License

## 🚀 **Available Commands**

| Command                  | Description             |
| ------------------------ | ----------------------- |
| `npm run docker:build`   | Build Docker image      |
| `npm run docker:start`   | Start Docker containers |
| `npm run docker:stop`    | Stop Docker containers  |
| `npm run docker:logs`    | View logs               |
| `npm run docker:restart` | Restart containers      |
| `npm run validate:env`   | Validate environment    |

The project is now clean, organized, and ready for development! 🎉
