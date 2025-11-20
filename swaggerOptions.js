import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Accounting & Financial Reports API",
      version: "1.0.0",
      description:
        " Nummix-in mühasibatlıq və maliyyə hesabatları API sənədləri",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local server",
      },
    ],
  },
  // Burada controller fayllarını göstərin ki, JSDoc yorumları oxunsun
  apis: [
    "./routes/budgetRoutes.js",
    "./routes/dashboardRoutes.js",
    "./routes/transactionRoutes.js",
    "./routes/cashAndBankRoutes.js",
    "./routes/userRoutes.js",
    "./routes/generalLedgerRoutes.js",
    "./controllers/BudgetController.js",
    "./controllers/DashboardController.js",
    "./controllers/TransactionController.js",
    "./controllers/CashAndBankController.js",
    "./controllers/PaymentController.js",
    "./controllers/UserController.js",
    "./controllers/GeneralLedgerController.js",
    "./routes/employeeRoutes.js",
    "./routes/customersRoute.js",
    "./routes/agreementsRoute.js",
    "./routes/salesRoute.js",
    "./routes/suppliersRoute.js",
    "./routes/supplierPaymentsRoute.js",
    "./routes/ordersRoute.js",
    "./routes/productsRoute.js",
    "./routes/warehousesRoute.js",
    "./routes/warehouseOperationsRoute.js",
    "./routes/inventoryRoute.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
