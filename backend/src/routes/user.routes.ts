import { Elysia, t } from "elysia";
import * as UserController from "../controllers/user.controller";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .post("/", UserController.createUser, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      user_code: t.String({ minLength: 1 }),
      name: t.String({ minLength: 1 }),
      phone: t.String({ minLength: 1 }),
      email: t.Optional(t.String()),
      password: t.Optional(t.String()),
      user_type: t.Optional(t.String()),
      location: t.Object({
        province: t.Optional(t.String()),
        district: t.String({ minLength: 1 }),
        municipality: t.String({ minLength: 1 }),
        ward_no: t.Numeric({ minimum: 1 }),
      }),
      verified_status: t.Optional(t.String()),
      balance: t.Optional(t.Numeric({ minimum: 0 })),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Create a new centralized User",
      tags: ["Users"],
    },
  })
  .get("/", UserController.getAllUsers, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      user_code: t.Optional(t.String()),
      user_type: t.Optional(t.String()),
      verified_status: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query all centralized Users",
      tags: ["Users"],
    },
  })
  .get("/:id", UserController.getUserById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get centralized User by ID",
      tags: ["Users"],
    },
  })
  .put("/:id", UserController.updateUser, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.Optional(t.String()),
      user_type: t.Optional(t.String()),
      location: t.Optional(
        t.Object({
          province: t.Optional(t.String()),
          district: t.String(),
          municipality: t.String(),
          ward_no: t.Numeric(),
        })
      ),
      verified_status: t.Optional(t.String()),
      balance: t.Optional(t.Numeric()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Update centralized User details by ID",
      tags: ["Users"],
    },
  })
  .delete("/:id", UserController.deleteUser, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific User by ID",
      tags: ["Users"],
    },
  });
