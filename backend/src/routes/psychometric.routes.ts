import { Elysia, t } from "elysia";
import * as PsychometricController from "../controllers/psychometric.controller";

export const psychometricRoutes = new Elysia()
  // ==========================================
  // PSYCHOMETRIC QUESTION ROUTES
  // ==========================================
  .post("/api/psychometric-questions", PsychometricController.createQuestion, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      question_code: t.String({ minLength: 1 }),
      question_text: t.String({ minLength: 1 }),
      trait_measured: t.String(),
      options: t.Object({
        A: t.Object({ text: t.String(), score: t.Numeric({ minimum: 0, maximum: 100 }) }),
        B: t.Object({ text: t.String(), score: t.Numeric({ minimum: 0, maximum: 100 }) }),
        C: t.Object({ text: t.String(), score: t.Numeric({ minimum: 0, maximum: 100 }) }),
        D: t.Object({ text: t.String(), score: t.Numeric({ minimum: 0, maximum: 100 }) }),
      }),
      best_option: t.String(),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Add a psychometric question scenario to the evaluation bank",
      tags: ["Psychometrics"],
    },
  })
  .get("/api/psychometric-questions", PsychometricController.getQuestions, {
    query: t.Object({
      trait_measured: t.Optional(t.String()),
      is_active: t.Optional(t.String()),
    }),
    detail: {
      summary: "Get all psychometric questions in the evaluation bank",
      tags: ["Psychometrics"],
    },
  })
  .get("/api/psychometric-questions/:id", PsychometricController.getQuestionById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific psychometric question by ID",
      tags: ["Psychometrics"],
    },
  })
  .put("/api/psychometric-questions/:id", PsychometricController.updateQuestion, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      question_code: t.Optional(t.String()),
      question_text: t.Optional(t.String()),
      trait_measured: t.Optional(t.String()),
      options: t.Optional(t.Any()),
      best_option: t.Optional(t.String()),
      is_active: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Update psychometric question details by ID",
      tags: ["Psychometrics"],
    },
  })
  .delete("/api/psychometric-questions/:id", PsychometricController.deleteQuestion, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Remove specific psychometric question from bank by ID",
      tags: ["Psychometrics"],
    },
  })

  // ==========================================
  // PSYCHOMETRIC ANSWER ROUTES
  // ==========================================
  .post("/api/psychometric-answers", PsychometricController.createAnswer, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      question_id: t.String({ minLength: 1 }),
      selected_option: t.String(),
      raw_score: t.Numeric({ minimum: 0, maximum: 100 }),
      normalized_score: t.Numeric({ minimum: 0, maximum: 1000 }),
      response_time_ms: t.Numeric({ minimum: 0 }),
      consistency_flag: t.Optional(t.Boolean()),
    }),
    detail: {
      summary: "Record merchant's response to a psychometric question",
      tags: ["Psychometrics"],
    },
  })
  .get("/api/psychometric-answers", PsychometricController.getAnswers, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      question_id: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query merchant psychometric answers",
      tags: ["Psychometrics"],
    },
  })
  .get("/api/psychometric-answers/:id", PsychometricController.getAnswerById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get specific psychometric answer record by ID",
      tags: ["Psychometrics"],
    },
  })
  .delete("/api/psychometric-answers/:id", PsychometricController.deleteAnswer, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete specific psychometric answer record by ID",
      tags: ["Psychometrics"],
    },
  });
