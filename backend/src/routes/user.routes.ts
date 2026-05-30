import { Elysia, t } from "elysia";
import * as UserController from "../controllers/user.controller";

export const userRoutes = new Elysia({ prefix: "/users" })
  // 1. Create a new user profile
  .post("/", UserController.createUser, {
    body: t.Object({
      name: t.String({ minLength: 2, error: "Name must be at least 2 characters" }),
      email: t.String({ format: "email", error: "Invalid email format" }),
      age: t.Optional(t.Numeric({ error: "Age must be a number" })),
      bio: t.Optional(t.String()),
    }),
    detail: {
      summary: "Create a new user (Open API)",
      tags: ["Users"],
    },
  })

  // 2. Fetch list of all user profiles
  .get("/", UserController.getAllUsers, {
    detail: {
      summary: "Get all users list (Open API)",
      tags: ["Users"],
    },
  })

  // 3. Fetch specific user details by ID
  .get("/:id", UserController.getUserById, {
    params: t.Object({
      id: t.String({ minLength: 1 }),
    }),
    detail: {
      summary: "Get user details by ID (Open API)",
      tags: ["Users"],
    },
  })

  // 4. Update specific user details by ID
  .put("/:id", UserController.updateUser, {
    params: t.Object({
      id: t.String({ minLength: 1 }),
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 2 })),
      email: t.Optional(t.String({ format: "email" })),
      age: t.Optional(t.Numeric()),
      bio: t.Optional(t.String()),
    }),
    detail: {
      summary: "Update user details by ID (Open API)",
      tags: ["Users"],
    },
  })

  // 5. Delete specific user profile by ID
  .delete("/:id", UserController.deleteUser, {
    params: t.Object({
      id: t.String({ minLength: 1 }),
    }),
    detail: {
      summary: "Delete user profile by ID (Open API)",
      tags: ["Users"],
    },
  });
