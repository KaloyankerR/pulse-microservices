#!/usr/bin/env node

/**
 * Environment validation script
 * Checks if required environment variables are properly set
 */

const requiredEnvVars = {
  DATABASE_URL: {
    required: true,
    validate: value => {
      if (!value) return 'DATABASE_URL is required';
      if (
        !value.startsWith('mongodb://') &&
        !value.startsWith('mongodb+srv://')
      ) {
        return 'DATABASE_URL must start with mongodb:// or mongodb+srv://';
      }
      return null;
    },
  },
  NEXTAUTH_SECRET: {
    required: true,
    validate: value => {
      if (!value) return 'NEXTAUTH_SECRET is required';
      if (value.length < 32)
        return 'NEXTAUTH_SECRET should be at least 32 characters long';
      return null;
    },
  },
  NEXTAUTH_JWT_SECRET: {
    required: true,
    validate: value => {
      if (!value) return 'NEXTAUTH_JWT_SECRET is required';
      if (value.length < 32)
        return 'NEXTAUTH_JWT_SECRET should be at least 32 characters long';
      return null;
    },
  },
  NEXTAUTH_URL: {
    required: true,
    validate: value => {
      if (!value) return 'NEXTAUTH_URL is required';
      try {
        new URL(value);
        return null;
      } catch (e) {
        return 'NEXTAUTH_URL must be a valid URL';
      }
    },
  },
};

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  let hasErrors = false;

  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

    if (config.required && !value) {
      console.error(`❌ ${varName}: ${config.validate(value)}`);
      hasErrors = true;
    } else if (value && config.validate) {
      const error = config.validate(value);
      if (error) {
        console.error(`❌ ${varName}: ${error}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${varName}: OK`);
      }
    } else if (value) {
      console.log(`✅ ${varName}: OK`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Environment validation failed!');
    console.log('\n📝 To fix these issues:');
    console.log('1. Copy docker.env.local to docker.env');
    console.log('2. Update the values with your actual configuration');
    console.log('3. For local development, use: npm run docker:local:up');
    console.log('4. For production, ensure all variables are properly set');
    process.exit(1);
  } else {
    console.log('\n✅ All environment variables are valid!');
  }
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
