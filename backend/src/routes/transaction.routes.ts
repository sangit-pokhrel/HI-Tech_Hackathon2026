import { Elysia, t } from "elysia";
import * as TransactionController from "../controllers/transaction.controller";

export const transactionRoutes = new Elysia({ prefix: "/api/transactions" })
  .post("/", TransactionController.createTransaction, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      transaction_code: t.String({ minLength: 1 }),
      sender_id: t.String({ minLength: 1 }),
      receiver_id: t.String({ minLength: 1 }),
      amount: t.Numeric({ minimum: 0 }),
      transaction_type: t.String(),
      status: t.Optional(t.String()),
      payment_channel: t.Optional(t.String()),
      transaction_growth_rate: t.Optional(t.Numeric()),
      device_id: t.Optional(t.String()),
      location: t.Optional(
        t.Object({
          district: t.Optional(t.String()),
          latitude: t.Optional(t.Numeric()),
          longitude: t.Optional(t.Numeric()),
        })
      ),
      remarks: t.Optional(t.String()),
    }),
    detail: {
      summary: "Create a new transaction record",
      tags: ["Transactions"],
    },
  })
  .get("/", TransactionController.getTransactions, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      transaction_type: t.Optional(t.String()),
      status: t.Optional(t.String()),
      sender_id: t.Optional(t.String()),
      receiver_id: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      minAmount: t.Optional(t.String()),
      maxAmount: t.Optional(t.String()),
      district: t.Optional(t.String()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query transactions with filters, pagination, and sorting",
      tags: ["Transactions"],
    },
  })
  .get("/:id", TransactionController.getTransactionById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific transaction details by ID",
      tags: ["Transactions"],
    },
  })
  .put("/:id", TransactionController.updateTransaction, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      sender_id: t.Optional(t.String()),
      receiver_id: t.Optional(t.String()),
      amount: t.Optional(t.Numeric()),
      transaction_type: t.Optional(t.String()),
      status: t.Optional(t.String()),
      payment_channel: t.Optional(t.String()),
      transaction_growth_rate: t.Optional(t.Numeric()),
      device_id: t.Optional(t.String()),
      location: t.Optional(
        t.Object({
          district: t.Optional(t.String()),
          latitude: t.Optional(t.Numeric()),
          longitude: t.Optional(t.Numeric()),
        })
      ),
      remarks: t.Optional(t.String()),
    }),
    detail: {
      summary: "Update transaction details by ID",
      tags: ["Transactions"],
    },
  })
  .delete("/:id", TransactionController.deleteTransaction, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific transaction by ID",
      tags: ["Transactions"],
    },
  });
