<div align="center">

<img src="https://user-images.githubusercontent.com/99184393/217984715-374189af-0e66-41cd-bca4-445b6045797e.png" alt="logo" width="50" height="auto" />
  
# Pulse
A modern social media platform built with Next.js, featuring real-time interactions, user authentication, and a clean, responsive design. Pulse provides a Twitter-like experience with posts, comments, following system, and notifications.

<!-- Badges -->

![](https://img.shields.io/badge/Next.js-13.2.4-black)
![](https://img.shields.io/badge/React-18.2.0-blue)
![](https://img.shields.io/badge/TypeScript-5.0.2-blue)
![](https://img.shields.io/badge/MongoDB-Database-green)
![](https://img.shields.io/badge/Prisma-ORM-purple)
![](https://img.shields.io/badge/Tailwind-CSS-cyan)
![](https://img.shields.io/badge/NextAuth-Authentication-orange)

<h4>
    <a href="#getting-started">Getting Started</a>
  <span> · </span>
    <a href="#features">Features</a>
  <span> · </span>
    <a href="#tech-stack">Tech Stack</a>
  <span> · </span>
    <a href="#architecture">Architecture</a>
  </h4>

</div>

<br/>

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based authentication with NextAuth.js
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- ⚡ **Real-time Updates** - SWR for efficient data fetching and caching
- 👥 **Social Features** - Follow users, like posts, and comment system
- 🔔 **Notifications** - Real-time notification system
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- 🚀 **Serverless** - Deployed on Vercel with automatic scaling
- 📊 **Analytics** - Built-in performance monitoring

## 🏗️ Architecture

Pulse follows a modern full-stack architecture:

- **Frontend**: Next.js with React and TypeScript
- **Authentication**: NextAuth.js with JWT strategy
- **API**: RESTful API routes with Prisma ORM
- **Database**: MongoDB with type-safe queries
- **Deployment**: Vercel serverless platform
- **State Management**: SWR for data fetching and caching

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- MongoDB account (local or cloud)
- Git for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/pulse.git
   cd pulse
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   DATABASE_URL="your_mongodb_connection_string"
   NEXTAUTH_JWT_SECRET="your_jwt_secret"
   NEXTAUTH_SECRET="your_nextauth_secret"
   ```

4. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🐳 Docker Setup (Recommended)

For easy deployment and consistency across environments:

1. **Configure environment**
   Edit `docker.env` with your MongoDB connection and secrets:

   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/pulse?retryWrites=true&w=majority"
   NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key-here"
   NEXTAUTH_JWT_SECRET="your-super-secret-jwt-secret-key-here"
   ```

2. **Start the application**

   ```bash
   ./start.sh
   ```

3. **Access the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

**Available Docker commands:**

- `npm run docker:start` - Start the application
- `npm run docker:stop` - Stop the application
- `npm run docker:logs` - View logs
- `npm run docker:restart` - Restart the application

## 📁 Project Structure

```
pulse/
├── components/          # React components
│   ├── modals/         # Authentication and interaction modals
│   ├── posts/          # Post-related components
│   ├── shared/         # Reusable UI components
│   └── users/          # User profile components
├── hooks/              # Custom React hooks
├── libs/               # Utility libraries
├── pages/              # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   └── users/         # User profile pages
├── prisma/            # Database schema and migrations
├── styles/            # Global CSS styles
├── types/             # TypeScript type definitions
└── utils/             # Helper functions and constants
```

## 🛠️ Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality & Formatting

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix fixable issues
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check if code is properly formatted (without changing files)
- `npm run type-check` - Run TypeScript type checking
- `npm run check-all` - Run all checks (type-check + lint + format:check)

### Database

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database

## 📚 API Documentation

Pulse includes comprehensive API documentation powered by Swagger/OpenAPI 3.0. The documentation is automatically generated from JSDoc comments in the API endpoints.

### Accessing API Documentation

Once your development server is running, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

### Features

- **🔍 Interactive Testing** - Test API endpoints directly from the documentation
- **📖 Comprehensive Coverage** - All API endpoints are documented with examples
- **🔐 Authentication Support** - Built-in support for testing authenticated endpoints
- **📱 Responsive Design** - Full-screen documentation optimized for all devices
- **⚡ Real-time Updates** - Documentation updates automatically when you modify API endpoints

### Documented Endpoints

The following API endpoints are currently documented:

#### Posts

- `GET /api/posts` - Retrieve posts from followed users or specific user
- `POST /api/posts` - Create a new post

#### Users

- `GET /api/users` - Get suggested users to follow
- `POST /api/follow` - Follow a user
- `DELETE /api/follow` - Unfollow a user

#### Events

- `GET /api/events` - Retrieve events with pagination
- `POST /api/events` - Create a new event

#### Interactions

- `POST /api/likes` - Like or unlike a post

### Adding Documentation to New Endpoints

To document a new API endpoint, add JSDoc comments above your handler function:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description of what this endpoint does
 *     description: Detailed description of the endpoint functionality
 *     tags: [YourTag]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Description of the parameter
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Your endpoint logic here
}
```

### Updating Documentation

**No build step required!** The Swagger documentation updates automatically:

1. **Add JSDoc comments** to your API endpoints
2. **Save the file** - Next.js will automatically recompile
3. **Refresh the documentation page** - Changes appear immediately

### Customization

The Swagger configuration is located in `/libs/swagger.ts`. You can customize:

- API information (title, version, description)
- Server URLs for different environments
- Authentication schemes
- Data models and schemas
- Global settings

### Quick Reference

| Task                      | Action                                          |
| ------------------------- | ----------------------------------------------- |
| **View Documentation**    | Visit `http://localhost:3000/api-docs`          |
| **Add New Endpoint Docs** | Add JSDoc comments above your handler function  |
| **Update Existing Docs**  | Modify JSDoc comments and refresh the page      |
| **Test Endpoints**        | Use the "Try it out" button in Swagger UI       |
| **Customize Appearance**  | Edit `/libs/swagger.ts` configuration           |
| **Add Authentication**    | Use `sessionAuth: []` in your endpoint security |

## 🗄️ Database Schema

Pulse uses MongoDB with the following main entities:

- **User** - User profiles, authentication, and social data
- **Post** - User posts with likes and comments
- **Comment** - Comments on posts
- **Event** - User-created events with RSVP functionality
- **Notification** - User notifications

## 🔧 Tech Stack

### Frontend

- **Next.js 13.2.4** - React framework with SSR
- **React 18.2.0** - UI library
- **TypeScript 5.0.2** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - Data fetching and caching
- **React Hot Toast** - Toast notifications

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication library
- **Prisma 4.12.0** - Database ORM
- **MongoDB** - NoSQL database
- **bcrypt** - Password hashing
- **Swagger/OpenAPI 3.0** - API documentation and testing

### Development

- **ESLint** - Code linting with Next.js rules
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Vercel Analytics** - Performance monitoring

## 🔧 Code Quality & Formatting

Pulse includes comprehensive code quality tools to maintain consistent, clean, and error-free code:

### ESLint Configuration

- **Next.js Rules**: Enforces Next.js best practices
- **Prettier Integration**: Prevents conflicts between ESLint and Prettier
- **Custom Rules**:
  - Warns about unused variables
  - Warns about console statements
  - Enforces `const` over `let` when possible
  - Prevents `var` usage

### Prettier Configuration

- **Single Quotes**: Consistent string formatting
- **Semicolons**: Enabled for better code clarity
- **2-Space Indentation**: Standard indentation
- **80 Character Line Width**: Readable line lengths
- **Trailing Commas**: ES5 compatible trailing commas

### Usage Examples

**Format all code:**

```bash
npm run format
```

**Check for formatting issues:**

```bash
npm run format:check
```

**Check for linting errors:**

```bash
npm run lint
```

**Auto-fix linting issues:**

```bash
npm run lint:fix
```

**Run all quality checks:**

```bash
npm run check-all
```

### Pre-commit Workflow

It's recommended to run `npm run check-all` before committing changes to ensure code quality:

```bash
# Check everything before committing
npm run check-all

# If issues are found, fix them
npm run format        # Fix formatting
npm run lint:fix      # Fix linting issues
npm run type-check    # Check TypeScript types
```

## 🚀 CI Pipeline

Pulse includes a CI (Continuous Integration) pipeline using GitHub Actions for automated code quality checks and build verification.

### Pipeline Features

- **🔄 Continuous Integration**: Automated code quality checks on every push/PR
- **🔒 Security Scanning**: Automated vulnerability scanning and dependency review
- **📊 Quality Gates**: TypeScript, ESLint, Prettier, and build verification
- **⚡ Fast Feedback**: Quick validation of code changes

### Workflow

**CI Workflow** (`.github/workflows/ci.yml`)

- **Code Quality Checks**: TypeScript, ESLint, Prettier validation
- **Security Audit**: npm audit and dependency review
- **Build Verification**: Ensures the application builds successfully

### Triggers

The pipeline runs automatically on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches

### Required Secrets (Optional)

For enhanced security checks, you can configure these in your GitHub repository settings:

```env
# Application (optional - uses dummy values for build if not set)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_JWT_SECRET=your_jwt_secret
DATABASE_URL=your_mongodb_url
```

### Local Quality Checks

Run the same checks locally before pushing:

```bash
# Run all quality checks
npm run check-all

# Individual checks
npm run type-check    # TypeScript validation
npm run lint          # ESLint checks
npm run format:check  # Prettier format validation
npm run build         # Build verification
```

For detailed pipeline documentation, see [`.github/PIPELINE.md`](.github/PIPELINE.md).

## 🚀 Deployment

### Deploy with Docker

The application is containerized and ready for deployment using Docker.

#### Prerequisites

- Docker installed on your system
- MongoDB database (cloud-hosted or local)
- Environment variables configured

#### Quick Start with Docker

1. **Configure Environment Variables**

   ```bash
   # Copy the example environment file
   cp docker.env.example .env

   # Edit the .env file with your actual values
   nano .env
   ```

2. **Build the Docker Image**

   ```bash
   npm run docker:build
   # or
   docker build -t pulse-app .
   ```

3. **Run the Container**

   ```bash
   npm run docker:run
   # or
   docker run -p 3000:3000 --env-file .env pulse-app
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`

#### Docker Commands

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `npm run docker:build` | Build the Docker image                                |
| `npm run docker:run`   | Run the container in production mode                  |
| `npm run docker:dev`   | Run the container in development mode with hot reload |

#### Production Deployment

For production deployment, consider using:

- **Docker Compose** for orchestration
- **Kubernetes** for container orchestration
- **Cloud platforms** like AWS ECS, Google Cloud Run, or Azure Container Instances

#### Environment Variables for Production

```env
DATABASE_URL="your_production_mongodb_url"
NEXTAUTH_JWT_SECRET="your_production_jwt_secret"
NEXTAUTH_SECRET="your_production_nextauth_secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables for Production

```env
DATABASE_URL="your_production_mongodb_url"
NEXTAUTH_JWT_SECRET="your_production_jwt_secret"
NEXTAUTH_SECRET="your_production_nextauth_secret"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - _Initial work_ - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Prisma team for the excellent ORM
- All open-source contributors

---

<div align="center">
  <p>Built with ❤️ using Next.js and modern web technologies</p>
</div>
