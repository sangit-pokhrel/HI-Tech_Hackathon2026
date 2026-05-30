import { Elysia, t } from "elysia";
import * as MLController from "../controllers/ml.controller";

export const mlRoutes = new Elysia()
  // ==========================================
  // MERCHANT FEATURES ROUTES
  // ==========================================
  .post("/api/merchant-features", MLController.createMerchantFeature, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      features: t.Object({
        monthly_revenue_avg: t.Numeric({ minimum: 0 }),
        active_days_ratio: t.Numeric({ minimum: 0, maximum: 1 }),
        transaction_growth_rate: t.Numeric(),
        supplier_payment_ratio: t.Numeric({ minimum: 0, maximum: 1 }),
        wallet_velocity_score: t.Numeric({ minimum: 0, maximum: 1 }),
        transaction_gravity_score: t.Numeric({ minimum: 0, maximum: 1 }),
        liquidity_buffer_score: t.Numeric({ minimum: 0, maximum: 1 }),
        remittance_security_score: t.Numeric({ minimum: 0, maximum: 1 }),
        airtime_consistency_score: t.Numeric({ minimum: 0, maximum: 1 }),
        utility_calibration_score: t.Numeric({ minimum: 0, maximum: 1 }),
        micro_obligation_score: t.Numeric({ minimum: 0, maximum: 1 }),
        social_pagerank_score: t.Numeric({ minimum: 0, maximum: 1 }),
        collusion_safety_score: t.Numeric({ minimum: 0, maximum: 1 }),
        guarantor_health_score: t.Numeric({ minimum: 0, maximum: 1 }),
        psychometric_avg: t.Numeric({ minimum: 0, maximum: 1000 }),
        conscientiousness_score: t.Numeric({ minimum: 0, maximum: 1 }),
        risk_decision_consistency_score: t.Numeric({ minimum: 0, maximum: 1 }),
        customer_diversity_score: t.Numeric({ minimum: 0, maximum: 1 }),
        repeat_customer_ratio: t.Numeric({ minimum: 0, maximum: 1 }),
        refund_rate: t.Numeric({ minimum: 0, maximum: 1 }),
        failed_payment_rate: t.Numeric({ minimum: 0, maximum: 1 }),
        cashout_speed_score: t.Numeric({ minimum: 0, maximum: 1 }),
        loan_to_income_ratio: t.Numeric({ minimum: 0 }),
        suspicious_spike_score: t.Numeric({ minimum: 0, maximum: 1 }),
        seasonal_pattern_score: t.Numeric({ minimum: 0, maximum: 1 }),
        repayment_consistency_score: t.Numeric({ minimum: 0, maximum: 1 }),
        repayment_plan_daily_fit: t.Numeric({ minimum: 0, maximum: 1 }),
        repayment_plan_weekly_fit: t.Numeric({ minimum: 0, maximum: 1 }),
        repayment_plan_seasonal_fit: t.Numeric({ minimum: 0, maximum: 1 }),
      }),
      ml_target: t.Object({
        repayment_outcome: t.String(),
        default_probability_label: t.Numeric(),
      }),
    }),
    detail: {
      summary: "Add or update the ML feature vector for a merchant",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/merchant-features", MLController.getMerchantFeatures, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      repayment_outcome: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query merchant features",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/merchant-features/:id", MLController.getMerchantFeatureById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get merchant features by ID",
      tags: ["Machine Learning"],
    },
  })
  .delete("/api/merchant-features/:id", MLController.deleteMerchantFeature, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Remove specific merchant features record by ID",
      tags: ["Machine Learning"],
    },
  })

  // ==========================================
  // MODEL PREDICTION ROUTES
  // ==========================================
  .post("/api/model-predictions", MLController.createModelPrediction, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      model_version: t.Optional(t.String()),
      default_probability: t.Numeric({ minimum: 0, maximum: 1 }),
      repayment_probability: t.Numeric({ minimum: 0, maximum: 1 }),
      predicted_class: t.String(),
      confidence: t.Numeric({ minimum: 0, maximum: 1 }),
      top_features: t.Array(
        t.Object({
          feature_name: t.String(),
          contribution: t.Numeric(),
        })
      ),
    }),
    detail: {
      summary: "Record an inference output from the ML credit classifier",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/model-predictions", MLController.getModelPredictions, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      predicted_class: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query model predictions",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/model-predictions/:id", MLController.getModelPredictionById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get model prediction record by ID",
      tags: ["Machine Learning"],
    },
  })
  .delete("/api/model-predictions/:id", MLController.deleteModelPrediction, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete model prediction record by ID",
      tags: ["Machine Learning"],
    },
  })

  // ==========================================
  // ML TRAINING RUN ROUTES
  // ==========================================
  .post("/api/ml-training-runs", MLController.createTrainingRun, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      model_version: t.String({ minLength: 1 }),
      algorithm: t.String(),
      training_records: t.Numeric({ minimum: 0 }),
      feature_count: t.Numeric({ minimum: 0 }),
      metrics: t.Object({
        accuracy: t.Numeric({ minimum: 0, maximum: 1 }),
        precision: t.Numeric({ minimum: 0, maximum: 1 }),
        recall: t.Numeric({ minimum: 0, maximum: 1 }),
        f1_score: t.Numeric({ minimum: 0, maximum: 1 }),
        roc_auc: t.Numeric({ minimum: 0, maximum: 1 }),
      }),
      artifact_path: t.Optional(t.String()),
    }),
    detail: {
      summary: "Record ML training execution details & metrics",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/ml-training-runs", MLController.getTrainingRuns, {
    detail: {
      summary: "Get all ML training run records",
      tags: ["Machine Learning"],
    },
  })
  .get("/api/ml-training-runs/:id", MLController.getTrainingRunById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get training run details by ID",
      tags: ["Machine Learning"],
    },
  })
  .delete("/api/ml-training-runs/:id", MLController.deleteTrainingRun, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Remove training run record by ID",
      tags: ["Machine Learning"],
    },
  });
