import { Elysia, t } from "elysia";
import * as ScoringController from "../controllers/scoring.controller";
import { authGuard } from "../middlewares/auth.middleware";

export const scoringRoutes = new Elysia({ prefix: "/api/users" })
  .use(authGuard)

  // GET /api/users/:id/score
  // Returns existing credit score OR data profile + psychometric questions when no score exists
  .get("/:id/score", ScoringController.getNagarikCreditsScore, {
    params: t.Object({
      id: t.String(),
    }),
    query: t.Object({
      refresh: t.Optional(t.String()),
    }),
    detail: {
      summary: "Get Nagarik Credits score (or data profile if no score exists)",
      tags: ["Scoring Engine"],
      security: [{ BearerAuth: [] }],
    },
  })

  // POST /api/users/:id/score/compute
  // Accepts psychometric answers → builds feature vector → calls ML → returns computed score
  .post("/:id/score/compute", ScoringController.computeNagarikCreditsScore, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      answers: t.Array(
        t.Object({
          question_id: t.String(),
          selected_option: t.String(),
          option_score: t.Numeric({ minimum: 0, maximum: 100 }),
        })
      ),
      business_type: t.Optional(t.String()),
    }),
    detail: {
      summary: "Compute Nagarik Credits score from psychometric answers via ML service",
      tags: ["Scoring Engine"],
      security: [{ BearerAuth: [] }],
    },
  })

  .post("/:id/score/test-transaction", ScoringController.createMerchantTestTransaction, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      amount: t.Optional(t.Numeric({ minimum: 100 })),
      transaction_type: t.Optional(t.String()),
      payment_channel: t.Optional(t.String()),
      remarks: t.Optional(t.String()),
    }),
    detail: {
      summary: "Create a demo merchant transaction and immediately refresh the live ML score",
      tags: ["Scoring Engine"],
      security: [{ BearerAuth: [] }],
    },
  });
