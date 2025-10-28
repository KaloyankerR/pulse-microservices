import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pulse Social Service API',
      version: '1.0.0',
      description: 'Social graph microservice for managing follows, blocks, and recommendations',
      contact: {
        name: 'Pulse Team',
        email: 'team@pulse.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8085}`,
        description: 'Development server',
      },
      {
        url: 'http://localhost:8000/api/v1/social',
        description: 'API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'string',
                  example: 'Error message',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                version: {
                  type: 'string',
                  example: 'v1',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpecs = swaggerJsdoc(options);

export default swaggerSpecs;

