export interface EnvironmentVariables {
  NODE_ENV?: string;
  PORT?: string;
  LOG_LEVEL?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  RABBITMQ_URL?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN?: string;
  USER_SERVICE_URL?: string;
  INTERNAL_SERVICE_TOKEN?: string;
}

export interface CorsOptions {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

