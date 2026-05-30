import { Elysia, t } from "elysia";
import * as MerchantController from "../controllers/merchant.controller";

export const merchantRoutes = new Elysia({ prefix: "/api/merchants" })
  .post("/", MerchantController.createMerchant, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      user_id: t.String({ minLength: 1 }),
      merchant_code: t.String({ minLength: 1 }),
      merchant_name: t.String({ minLength: 1 }),
      business_type: t.String(),
      registration_status: t.Optional(t.String()),
      wallet_age_months: t.Numeric({ minimum: 0 }),
      business_started_year: t.Optional(t.Numeric()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Create a new merchant profile linked to parent User",
      tags: ["Merchants"],
    },
  })
  .get("/", MerchantController.getAllMerchants, {
    detail: {
      summary: "Get all merchants",
      tags: ["Merchants"],
    },
  })
  .get("/:id", MerchantController.getMerchantById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get merchant by ID",
      tags: ["Merchants"],
    },
  })
  .put("/:id", MerchantController.updateMerchant, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      user_id: t.Optional(t.String()),
      merchant_name: t.Optional(t.String()),
      business_type: t.Optional(t.String()),
      registration_status: t.Optional(t.String()),
      wallet_age_months: t.Optional(t.Numeric()),
      business_started_year: t.Optional(t.Numeric()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Update merchant profile details by ID",
      tags: ["Merchants"],
    },
  })
  .delete("/:id", MerchantController.deleteMerchant, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete merchant by ID",
      tags: ["Merchants"],
    },
  });
