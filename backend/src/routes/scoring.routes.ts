import { Elysia, t } from "elysia";
import * as ScoringController from "../controllers/scoring.controller";

export const scoringRoutes = new Elysia({ prefix: "/api/users" })
  .get("/:id/score", ScoringController.getBishwasScore, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Calculate the mathematical Bishwas credit score for a user",
      tags: ["Scoring Engine"],
    },
  });
