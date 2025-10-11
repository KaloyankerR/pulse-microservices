# Twitter Clone - C4 Containers Architecture

```mermaid
graph TB
    %% Users
    User["👤 Users<br/>(Social Media Users)"]

    %% Frontend Container
    WebApp["🌐 Web Application<br/>(Next.js Frontend)<br/>• React Components<br/>• Tailwind CSS<br/>• SWR State Management"]

    %% Authentication Container
    NextAuth["🔐 NextAuth.js<br/>(Authentication Service)<br/>• JWT Tokens<br/>• Session Management<br/>• Credentials Provider"]

    %% API Container
    APIGateway["🔌 API Gateway<br/>(Next.js API Routes)<br/>• REST Endpoints<br/>• Business Logic<br/>• Data Validation"]

    %% Database Container
    Database["🍃 MongoDB<br/>(Data Storage)<br/>• User Data<br/>• Posts & Comments<br/>• Social Relationships"]

    %% External Services
    Vercel["☁️ Vercel Platform<br/>(Hosting & Analytics)<br/>• Serverless Deployment<br/>• CDN<br/>• Performance Monitoring"]

    %% Connections
    User -->|"Interacts with UI"| WebApp
    WebApp -->|"Authenticates"| NextAuth
    WebApp -->|"API Calls"| APIGateway
    NextAuth -->|"Validates Credentials"| Database
    APIGateway -->|"CRUD Operations"| Database
    WebApp -->|"Deployed on"| Vercel

    %% Styling
    classDef user fill:#e8f5e8,stroke:#4caf50,stroke-width:3px
    classDef frontend fill:#e3f2fd,stroke:#2196f3,stroke-width:3px
    classDef auth fill:#fff3e0,stroke:#ff9800,stroke-width:3px
    classDef api fill:#f3e5f5,stroke:#9c27b0,stroke-width:3px
    classDef database fill:#e8f5e8,stroke:#4caf50,stroke-width:3px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:3px

    class User user
    class WebApp frontend
    class NextAuth auth
    class APIGateway api
    class Database database
    class Vercel external
```

## 🏗️ Container Architecture

### **Core Containers:**

#### 🌐 **Web Application (Next.js Frontend)**

- **Technology**: Next.js, React, TypeScript
- **Responsibilities**:
  - User interface rendering
  - Client-side state management (SWR)
  - User interactions and routing
  - Responsive design (Tailwind CSS)

#### 🔐 **NextAuth.js (Authentication Service)**

- **Technology**: NextAuth.js with JWT strategy
- **Responsibilities**:
  - User authentication and authorization
  - Session management
  - Credential validation
  - Security token handling

#### 🔌 **API Gateway (Next.js API Routes)**

- **Technology**: Next.js API Routes, Prisma ORM
- **Responsibilities**:
  - RESTful API endpoints
  - Business logic implementation
  - Data validation and processing
  - Database interaction coordination

#### 🍃 **MongoDB (Data Storage)**

- **Technology**: MongoDB with Prisma ORM
- **Responsibilities**:
  - User profile and authentication data
  - Posts, comments, and social content
  - Following relationships and notifications
  - Data persistence and retrieval

#### ☁️ **Vercel Platform (External Service)**

- **Technology**: Vercel hosting platform
- **Responsibilities**:
  - Serverless application hosting
  - CDN and edge computing
  - Performance monitoring and analytics
  - Automatic scaling and deployment

### **Key Data Flows:**

1. **Authentication Flow**: User → WebApp → NextAuth → Database
2. **Content Flow**: User → WebApp → API Gateway → Database
3. **Deployment Flow**: WebApp → Vercel Platform
4. **Data Flow**: API Gateway ↔ Database (via Prisma)

### **Architecture Benefits:**

- 🔒 **Secure**: Dedicated authentication service with JWT
- 🚀 **Scalable**: Serverless containers with automatic scaling
- 🔄 **Maintainable**: Clear separation of concerns
- ⚡ **Performant**: Optimized data fetching and caching
- 📊 **Monitored**: Built-in analytics and performance tracking
