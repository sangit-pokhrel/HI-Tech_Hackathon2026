import { Elysia, t } from "elysia";
import * as ScoringController from "../controllers/scoring.controller";
import { authGuard } from "../middlewares/auth.middleware";

export const scoringRoutes = new Elysia({ prefix: "/api/users" })
  .use(authGuard)
  .get("/:id/score", ScoringController.getNagarikCreditsScore, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Calculate the mathematical Nagarik Credits score for a user",
      tags: ["Scoring Engine"],
      security: [{ BearerAuth: [] }],
    },
  });
