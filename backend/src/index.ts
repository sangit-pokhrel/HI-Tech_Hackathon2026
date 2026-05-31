import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";
import { connectDB } from "./db/db";
import { authRoutes } from "./routes/auth.routes";
import { merchantRoutes } from "./routes/merchant.routes";
import { customerRoutes } from "./routes/customer.routes";
import { transactionRoutes } from "./routes/transaction.routes";
import { utilityRoutes } from "./routes/utility.routes";
import { walletRoutes } from "./routes/wallet.routes";
import { userRoutes } from "./routes/user.routes";
import { scoringRoutes } from "./routes/scoring.routes";
import { loanRoutes } from "./routes/loan.routes";
import { socialRoutes } from "./routes/social.routes";
import { psychometricRoutes } from "./routes/psychometric.routes";
import { mlRoutes } from "./routes/ml.routes";
import { creditRoutes } from "./routes/credit.routes";

const port = process.env.PORT || 3000;

// Connect to MongoDB database
await connectDB();

const app = new Elysia()
  // Global CORS middleware
  .use(cors())
  // Global JWT configuration
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "nagarik_credits_jwt_secret_key_2026",
    })
  )
  // Global Swagger documentation page configuration
  .use(
    swagger({
      documentation: {
        info: {
          title: "Nagarik Credits Fast Backend API Documentation",
          version: "1.0.0",
          description: "High-performance Elysia.js + MongoDB open CRUD API template for micro-merchants in Nepal",
        },
      },
      path: "/swagger",
    })
  )
  
  // Custom global error handling handler
  .onError(({ code, error, set }) => {
    console.error(`[Error] [${code}]:`, error.message);
    
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        message: "Validation Error",
        errors: error.message,
      };
    }
    
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        message: "Endpoint not found",
      };
    }

    set.status = 500;
    return {
      success: false,
      message: error.message || "Internal server error occurred",
    };
  })

  // Root / Home endpoint
  .get("/", () => ({
    success: true,
    message: "Nagarik Credits Super Fast MongoDB Backend API is running!",
    docs: "/swagger",
  }))

  // Health check endpoint
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))

  // Mount Application Routes
  .use(authRoutes)
  .use(merchantRoutes)
  .use(customerRoutes)
  .use(transactionRoutes)
  .use(utilityRoutes)
  .use(walletRoutes)
  .use(userRoutes)
  .use(scoringRoutes)
  .use(loanRoutes)
  .use(socialRoutes)
  .use(psychometricRoutes)
  .use(mlRoutes)
  .use(creditRoutes)

  // Start listening
  .listen(port);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📖 Swagger documentation is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
