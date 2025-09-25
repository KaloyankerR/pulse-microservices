const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pulse User Service API',
      version: '1.0.0',
      description: 'User management microservice for Pulse social media platform',
      contact: {
        name: 'Pulse Team',
        email: 'support@pulse.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: 'Development server',
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
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Unique username',
            },
            displayName: {
              type: 'string',
              description: 'User display name',
            },
            bio: {
              type: 'string',
              description: 'User biography',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to user avatar image',
            },
            verified: {
              type: 'boolean',
              description: 'Whether the user is verified',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
              description: 'User account status',
            },
            followersCount: {
              type: 'integer',
              description: 'Number of followers',
            },
            followingCount: {
              type: 'integer',
              description: 'Number of users being followed',
            },
            isFollowing: {
              type: 'boolean',
              description: 'Whether the current user follows this user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Unique username (alphanumeric and underscore only)',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
            },
            displayName: {
              type: 'string',
              maxLength: 100,
              description: 'User display name',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'User display name',
            },
            bio: {
              type: 'string',
              maxLength: 500,
              description: 'User biography',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to user avatar image',
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              description: 'Current password',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description: 'New password (min 8 chars, must include uppercase, lowercase, number, and special character)',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        UpdateUserStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
              description: 'New user status',
            },
          },
        },
        LinkGoogleAccountRequest: {
          type: 'object',
          required: ['googleProfile'],
          properties: {
            googleProfile: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Google user ID',
                },
                emails: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      value: {
                        type: 'string',
                        format: 'email',
                      },
                    },
                  },
                },
                displayName: {
                  type: 'string',
                },
                photos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      value: {
                        type: 'string',
                        format: 'uri',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        PaginationQuery: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Number of items per page',
            },
          },
        },
        SearchUsersQuery: {
          allOf: [
            { $ref: '#/components/schemas/PaginationQuery' },
            {
              type: 'object',
              required: ['q'],
              properties: {
                q: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Search query',
                },
              },
            },
          ],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
            },
            totalCount: {
              type: 'integer',
              description: 'Total number of items',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                },
                version: {
                  type: 'string',
                  example: 'v1',
                  description: 'API version',
                },
              },
            },
          },
        },
        ErrorResponse: {
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
                  description: 'Error code',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        description: 'Field name that caused the error',
                      },
                      message: {
                        type: 'string',
                        description: 'Field-specific error message',
                      },
                    },
                  },
                  description: 'Detailed error information',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                },
                version: {
                  type: 'string',
                  example: 'v1',
                  description: 'API version',
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
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
