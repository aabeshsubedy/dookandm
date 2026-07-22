import swaggerJsdoc from 'swagger-jsdoc';
import { BRAND } from '@dokaandm/shared';
import { env } from './env.js';

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: `${BRAND.name} API`,
      version: '1.0.0',
      description:
        'Omnichannel inbox, order capture & lightweight CRM for Nepali social commerce sellers. ' +
        'All list endpoints are paginated and scoped to the authenticated seller (multi-tenant).',
    },
    servers: [{ url: `http://localhost:${env.PORT}/api`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth' },
      { name: 'Channels' },
      { name: 'Webhooks' },
      { name: 'Inbox' },
      { name: 'Customers' },
      { name: 'Orders' },
      { name: 'Reminders' },
      { name: 'Dashboard' },
      { name: 'Plan' },
      { name: 'Activity' },
      { name: 'System' },
    ],
  },
  apis: ['./src/routes/*.js'],
});

export default spec;
