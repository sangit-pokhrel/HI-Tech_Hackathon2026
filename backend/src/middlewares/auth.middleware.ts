import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Configuration for JWT verification
export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "nagarik_credits_jwt_secret_key_2026",
    })
  )
  .derive(async ({ headers, jwt }: any) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
      };
    }

    const token = authHeader.split(" ")[1];
    const payload = await jwt.verify(token);

    if (!payload) {
      return {
        user: null,
      };
    }

    return {
      user: payload,
    };
  })
  .as("plugin");

// Guard plugin that requires active user context session
export const authGuard = (app: Elysia) =>
  app.use(authMiddleware).onBeforeHandle(({ user, set }: any) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized: Access token is missing or invalid",
      };
    }
  });
