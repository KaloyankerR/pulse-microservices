# Week 8 Progress

## Fixed some issues with the pipeline
## Grafana & Prometheus introduction
##  Rewrote `notification-service` from JS to TS
## Rewrote `social-service` from JS to TS
## created and organized a separate Makerfile for every service
## Grafana & Prometheus configured. Configured business logic, infrastructure, microservice and healthy check metrics



---


# TypeScript Migration Prompt Template

## Context
Convert the `[SERVICE-NAME]` microservice from JavaScript to TypeScript, maintaining 100% backward compatibility with existing event contracts, APIs, and functionality.

## Requirements
- **Testing**: Port existing Jest tests to TypeScript, don't write new ones
- **Build**: `ts-node-dev` for dev, compiled JS (`dist/`) for production
- **Database**: Keep existing ODM (Mongoose/Prisma) with proper TypeScript types
- **Compatibility**: Zero breaking changes to external contracts

## Conversion Order (Critical)

1. **Types First** (`src/types/`) - API, models, events, config`)
2. **Utils** - Logger, helpers (least dependencies)
3. **Config** - Database, Redis, RabbitMQ, Metrics
4. **Models** - Mongoose schemas with interfaces
5. **Services** - Business logic with typed methods
6. **Middleware** - Auth, error handling, validation
7. **Controllers** - Route handlers with typed requests
8. **Routes** - Express routes with proper async handling
9. **Entry Points** - `app.ts`, `server.ts` (convert last)

## Setup Checklist

```bash
# Install dependencies
npm install --save-dev typescript @types/node @types/express [other @types]
npm install --save-dev ts-node ts-node-dev ts-jest

# Update package.json scripts
"build": "tsc -p tsconfig.build.json"
"start": "node dist/server.js"
"dev": "ts-node-dev --respawn --transpile-only src/server.ts"
"type-check": "tsc --noEmit"
```

## TypeScript Config Template

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Common Patterns

### Mongoose Model
```typescript
export interface IModel extends Document {
  field: string;
}

const schema = new Schema<IModel>({ field: String });
interface ModelModel extends Model<IModel> {
  staticMethod(): Promise<IModel[]>;
}

const Model = mongoose.model<IModel, ModelModel>('Model', schema);
export default Model;
```

### Express Controller
```typescript
async method(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    // ... logic
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
}
```

### Routes with Async
```typescript
router.get('/path', authenticateToken, 
  (req, res, next) => controller.method(req as AuthenticatedRequest, res));
```

## Dockerfile Production Stage

```dockerfile
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build
RUN npm prune --production && npm cache clean --force
CMD ["node", "dist/server.js"]
```

## Common Pitfalls & Fixes

1. **Server crash on startup**: Check for `setTimeout` that should only run during shutdown
2. **Compilation errors**: Verify MongoDB aggregation syntax, async return types
3. **Import mismatches**: Remove old `.js` files after conversion, check default exports
4. **Route handlers**: Wrap async controller methods properly (can't bind directly)

## Verification

- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] Service starts without errors
- [ ] All API endpoints work
- [ ] Event consumers/publishers work (if applicable)
- [ ] Health checks pass
- [ ] Docker builds and runs
- [ ] Existing tests pass (after TS conversion)
- [ ] Docker deploys successfully 

## Critical: Document Before Starting

- Event payloads consumed/published
- API request/response formats
- JWT token structure
- Database schema interfaces
