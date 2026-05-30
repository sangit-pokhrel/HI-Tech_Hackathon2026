import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { connectDB } from "./db/db";
import { userRoutes } from "./routes/user.routes";

const port = process.env.PORT || 3000;

// Connect to MongoDB database
await connectDB();

const app = new Elysia()
  // Global CORS middleware
  .use(cors())
  // Global Swagger documentation page configuration
  .use(
    swagger({
      documentation: {
        info: {
          title: "Bun + MongoDB Fast Backend API Documentation",
          version: "1.0.0",
          description: "High-performance Elysia.js + MongoDB open CRUD API template",
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
    message: "Bun Super Fast MongoDB Backend API is running!",
    docs: "/swagger",
  }))

  // Health check endpoint
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))

  // Mount Application Routes
  .use(userRoutes)

  // Start listening
  .listen(port);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📖 Swagger documentation is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
