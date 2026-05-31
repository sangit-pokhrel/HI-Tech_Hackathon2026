import { Elysia, t } from "elysia";
import * as CreditController from "../controllers/credit.controller";

export const creditRoutes = new Elysia({ prefix: "/api/credit-scores" })
  .post("/", CreditController.createCreditScore, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      factor_scores: t.Object({
        f1_livelihood_rhythm: t.Numeric({ minimum: 0, maximum: 200 }),
        f2_cash_flow_elasticity: t.Numeric({ minimum: 0, maximum: 180 }),
        f3_smart_digital_footprint: t.Numeric({ minimum: 0, maximum: 220 }),
        f4_community_trust_graph: t.Numeric({ minimum: 0, maximum: 200 }),
        f5_psychometric: t.Numeric({ minimum: 0, maximum: 200 }),
        fraud_penalty: t.Numeric({ minimum: 0, maximum: 250 }),
      }),
      ml_scores: t.Object({
        ml_repayment_score: t.Numeric({ minimum: 0, maximum: 1000 }),
        default_probability: t.Numeric({ minimum: 0, maximum: 1 }),
        repayment_probability: t.Numeric({ minimum: 0, maximum: 1 }),
      }),
      final_nagarik_credits_score: t.Numeric({ minimum: 0, maximum: 1000 }),
      risk_band: t.String(),
      decision: t.String(),
      suggested_loan_amount: t.Numeric({ minimum: 0 }),
      repayment_plan: t.String(),
      fraud_flags: t.Optional(t.Array(t.String())),
      explanation: t.String(),
    }),
    detail: {
      summary: "Save a calculated blended alternative credit score for a merchant",
      tags: ["CreditScores"],
    },
  })
  .get("/", CreditController.getCreditScores, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      risk_band: t.Optional(t.String()),
      decision: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query saved credit scores",
      tags: ["CreditScores"],
    },
  })
  .get("/:id", CreditController.getCreditScoreById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific credit score record by ID",
      tags: ["CreditScores"],
    },
  })
  .delete("/:id", CreditController.deleteCreditScore, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific credit score record by ID",
      tags: ["CreditScores"],
    },
  });
