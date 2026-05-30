import { Elysia, t } from "elysia";
import * as MerchantController from "../controllers/merchant.controller";

export const merchantRoutes = new Elysia({ prefix: "/api/merchants" })
  .post("/", MerchantController.createMerchant, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_code: t.String({ minLength: 1 }),
      merchant_name: t.String({ minLength: 1 }),
      owner_name: t.String({ minLength: 1 }),
      phone_number: t.String({ minLength: 1 }),
      business_type: t.String(),
      registration_status: t.Optional(t.String()),
      location: t.Object({
        province: t.Optional(t.String()),
        district: t.String({ minLength: 1 }),
        municipality: t.String({ minLength: 1 }),
        ward_no: t.Numeric({ minimum: 1 }),
      }),
      wallet_age_months: t.Numeric({ minimum: 0 }),
      business_started_year: t.Optional(t.Numeric()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Create a new merchant profile",
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
      merchant_name: t.Optional(t.String()),
      owner_name: t.Optional(t.String()),
      phone_number: t.Optional(t.String()),
      business_type: t.Optional(t.String()),
      registration_status: t.Optional(t.String()),
      location: t.Optional(
        t.Object({
          province: t.Optional(t.String()),
          district: t.String(),
          municipality: t.String(),
          ward_no: t.Numeric(),
        })
      ),
      wallet_age_months: t.Optional(t.Numeric()),
      business_started_year: t.Optional(t.Numeric()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Update merchant by ID",
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
