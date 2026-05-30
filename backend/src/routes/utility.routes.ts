import { Elysia, t } from "elysia";
import * as UtilityController from "../controllers/utility.controller";

export const utilityRoutes = new Elysia({ prefix: "/api/utility-payments" })
  .post("/", UtilityController.createUtilityPayment, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      sender_id: t.String({ minLength: 1 }),
      bill_type: t.String(),
      bill_amount: t.Numeric({ minimum: 0 }),
      due_date: t.String(),
      paid_date: t.Optional(t.String()),
      payment_status: t.Optional(t.String()),
      days_late: t.Optional(t.Numeric({ minimum: 0 })),
    }),
    detail: {
      summary: "Create a new utility payment record",
      tags: ["Utility Payments"],
    },
  })
  .get("/", UtilityController.getUtilityPayments, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      sender_id: t.Optional(t.String()),
      bill_type: t.Optional(t.String()),
      payment_status: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query utility payments with filters and pagination",
      tags: ["Utility Payments"],
    },
  })
  .get("/:id", UtilityController.getUtilityPaymentById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific utility payment record by ID",
      tags: ["Utility Payments"],
    },
  })
  .put("/:id", UtilityController.updateUtilityPayment, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      merchant_id: t.Optional(t.String()),
      sender_id: t.Optional(t.String()),
      bill_type: t.Optional(t.String()),
      bill_amount: t.Optional(t.Numeric()),
      due_date: t.Optional(t.String()),
      paid_date: t.Optional(t.String()),
      payment_status: t.Optional(t.String()),
      days_late: t.Optional(t.Numeric()),
    }),
    detail: {
      summary: "Update utility payment details by ID",
      tags: ["Utility Payments"],
    },
  })
  .delete("/:id", UtilityController.deleteUtilityPayment, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific utility payment by ID",
      tags: ["Utility Payments"],
    },
  });
