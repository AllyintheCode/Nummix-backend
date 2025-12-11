// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Nummix API Documentation",
      version: "1.0.0",
      description: "Nummix backend API sənədləşməsi (security-siz)",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
  },

  // bütün route-ları oxusun
  apis: ["./routes/*.js"],
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };
