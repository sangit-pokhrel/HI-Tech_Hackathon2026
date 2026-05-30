import { Elysia, t } from "elysia";
import * as SocialController from "../controllers/social.controller";

export const socialRoutes = new Elysia({ prefix: "/api/social-edges" })
  .post("/", SocialController.createSocialEdge, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      source_merchant_id: t.String({ minLength: 1 }),
      target_entity_type: t.String(),
      target_entity_id: t.String({ minLength: 1 }),
      relationship_type: t.String(),
      trust_strength: t.Numeric({ minimum: 1, maximum: 10 }),
      transaction_count: t.Optional(t.Numeric({ minimum: 0 })),
      total_transaction_value: t.Optional(t.Numeric({ minimum: 0 })),
    }),
    detail: {
      summary: "Add a trust/transaction edge in the community graph",
      tags: ["SocialEdges"],
    },
  })
  .get("/", SocialController.getSocialEdges, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      source_merchant_id: t.Optional(t.String()),
      target_entity_id: t.Optional(t.String()),
      relationship_type: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query social edges",
      tags: ["SocialEdges"],
    },
  })
  .get("/:id", SocialController.getSocialEdgeById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific social edge by ID",
      tags: ["SocialEdges"],
    },
  })
  .put("/:id", SocialController.updateSocialEdge, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      source_merchant_id: t.Optional(t.String()),
      target_entity_type: t.Optional(t.String()),
      target_entity_id: t.Optional(t.String()),
      relationship_type: t.Optional(t.String()),
      trust_strength: t.Optional(t.Numeric()),
      transaction_count: t.Optional(t.Numeric()),
      total_transaction_value: t.Optional(t.Numeric()),
    }),
    detail: {
      summary: "Update social edge properties by ID",
      tags: ["SocialEdges"],
    },
  })
  .delete("/:id", SocialController.deleteSocialEdge, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Remove specific social edge by ID",
      tags: ["SocialEdges"],
    },
  });
