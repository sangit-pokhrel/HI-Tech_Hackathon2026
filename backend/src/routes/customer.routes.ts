import { Elysia, t } from "elysia";
import * as CustomerController from "../controllers/customer.controller";

export const customerRoutes = new Elysia({ prefix: "/api/customers" })
  .post("/", CustomerController.createCustomer, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      customer_code: t.String({ minLength: 1 }),
      customer_name: t.String({ minLength: 1 }),
      phone_number: t.Optional(t.String()),
      location: t.Object({
        province: t.Optional(t.String()),
        district: t.String({ minLength: 1 }),
        municipality: t.String({ minLength: 1 }),
        ward_no: t.Numeric({ minimum: 1 }),
      }),
      verified_status: t.Optional(t.String()),
      balance: t.Optional(t.Numeric({ minimum: 0 })),
    }),
    detail: {
      summary: "Create a new customer profile",
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
      customer_name: t.Optional(t.String()),
      phone_number: t.Optional(t.String()),
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
    }),
    detail: {
      summary: "Update customer by ID",
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
