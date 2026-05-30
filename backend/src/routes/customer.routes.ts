import { Elysia, t } from "elysia";
import * as CustomerController from "../controllers/customer.controller";

export const customerRoutes = new Elysia({ prefix: "/api/customers" })
  .post("/", CustomerController.createCustomer, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      user_id: t.String({ minLength: 1 }),
      customer_code: t.String({ minLength: 1 }),
      customer_name: t.String({ minLength: 1 }),
    }),
    detail: {
      summary: "Create a new customer profile linked to parent User",
      tags: ["Customers"],
    },
  })
  .get("/", CustomerController.getAllCustomers, {
    detail: {
      summary: "Get all customers",
      tags: ["Customers"],
    },
  })
  .get("/:id", CustomerController.getCustomerById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get customer by ID",
      tags: ["Customers"],
    },
  })
  .put("/:id", CustomerController.updateCustomer, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      user_id: t.Optional(t.String()),
      customer_name: t.Optional(t.String()),
    }),
    detail: {
      summary: "Update customer profile by ID",
      tags: ["Customers"],
    },
  })
  .delete("/:id", CustomerController.deleteCustomer, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete customer by ID",
      tags: ["Customers"],
    },
  });
