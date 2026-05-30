import { Elysia, t } from "elysia";
import * as WalletController from "../controllers/wallet.controller";

export const walletRoutes = new Elysia({ prefix: "/api/wallet-activities" })
  .post("/", WalletController.createWalletActivity, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      activity_type: t.String(),
      amount: t.Numeric({ minimum: 0 }),
      balance_after_transaction: t.Numeric(),
      activity_time: t.Optional(t.String()),
    }),
    detail: {
      summary: "Create a new wallet activity record",
      tags: ["Wallet Activities"],
    },
  })
  .get("/", WalletController.getWalletActivities, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      activity_type: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query wallet activities with filters and pagination",
      tags: ["Wallet Activities"],
    },
  })
  .get("/:id", WalletController.getWalletActivityById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific wallet activity by ID",
      tags: ["Wallet Activities"],
    },
  })
  .put("/:id", WalletController.updateWalletActivity, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      merchant_id: t.Optional(t.String()),
      activity_type: t.Optional(t.String()),
      amount: t.Optional(t.Numeric()),
      balance_after_transaction: t.Optional(t.Numeric()),
      activity_time: t.Optional(t.String()),
    }),
    detail: {
      summary: "Update wallet activity details by ID",
      tags: ["Wallet Activities"],
    },
  })
  .delete("/:id", WalletController.deleteWalletActivity, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific wallet activity by ID",
      tags: ["Wallet Activities"],
    },
  });
