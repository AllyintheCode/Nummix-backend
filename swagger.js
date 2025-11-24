// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NumMix Asset Management API',
      version: '1.0.0',
      description: 'Vəsait İdarəetmə Sistemi API Dokumentasiyası',
      contact: {
        name: 'API Support',
        email: 'support@nummix.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js'], // API route fayllarının yeri
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };