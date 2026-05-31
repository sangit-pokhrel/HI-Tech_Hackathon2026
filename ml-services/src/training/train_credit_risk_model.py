import json
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from src.common.config import PROCESSED_DATA_DIR, MODEL_DIR, METRICS_DIR
from src.common.logger import logger

DATASET_PATH = PROCESSED_DATA_DIR / "merchant_training_dataset.csv"
TARGET = "default_label"

FEATURE_COLUMNS = [
    "monthly_revenue_avg",
    "active_days_ratio",
    "transaction_growth_rate",
    "supplier_payment_ratio",
    "wallet_velocity_score",
    "transaction_gravity_score",
    "liquidity_buffer_score",
    "remittance_security_score",
    "airtime_consistency_score",
    "utility_calibration_score",
    "micro_obligation_score",
    "social_pagerank_score",
    "collusion_safety_score",
    "guarantor_health_score",
    "psychometric_avg",
    "conscientiousness_score",
    "risk_decision_consistency_score",
    "customer_diversity_score",
    "repeat_customer_ratio",
    "refund_rate",
    "failed_payment_rate",
    "cashout_speed_score",
    "loan_to_income_ratio",
    "suspicious_spike_score",
    "seasonal_pattern_score",
    "repayment_consistency_score",
    "f1_livelihood_rhythm",
    "f2_cash_flow_elasticity",
    "f3_smart_digital_footprint",
    "f4_community_trust_graph",
    "f5_psychometric",
]


def evaluate_model(model, x_train, x_test, y_train, y_test):
    model.fit(x_train, y_train)
    y_pred = model.predict(x_test)

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(x_test)[:, 1]
    else:
        y_prob = y_pred

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1_score": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob) if len(set(y_test)) > 1 else 0,
    }

    return model, metrics


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError("merchant_training_dataset.csv not found. Run build_features first.")

    df = pd.read_csv(DATASET_PATH)

    missing = [col for col in FEATURE_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")

    x = df[FEATURE_COLUMNS].fillna(0)
    y = df[TARGET].astype(int)

    if len(set(y)) < 2:
        raise ValueError(
            "Only one class exists in default_label. "
            "Add repayment_records with ml_target_default 0/1 or enable GENERATE_SYNTHETIC_LABELS=true."
        )

    stratify_value = y if y.value_counts().min() >= 2 else None

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=stratify_value,
    )

    candidate_models = {
        "logistic_regression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=10,
            random_state=42,
            class_weight="balanced",
        ),
        "gradient_boosting": GradientBoostingClassifier(random_state=42),
    }

    trained_models = {}
    all_metrics = {}

    for name, model in candidate_models.items():
        try:
            trained_model, metrics = evaluate_model(model, x_train, x_test, y_train, y_test)
            trained_models[name] = trained_model
            all_metrics[name] = metrics
            logger.info(f"{name}: {metrics}")
        except Exception as error:
            logger.error(f"Training failed for {name}: {error}")

    if not trained_models:
        raise RuntimeError("No model trained successfully.")

    # Select best model based on F1-score with accuracy fallback
    best_model_name = max(all_metrics, key=lambda name: (all_metrics[name]["f1_score"], all_metrics[name]["accuracy"]))
    
    # Retrain the selected best model on the ENTIRE dataset (100% of data)
    logger.info(f"Retraining the best model ({best_model_name}) on the entire dataset...")
    best_model = candidate_models[best_model_name]
    best_model.fit(x, y)

    joblib.dump(best_model, MODEL_DIR / "credit_risk_model.pkl")

    with open(MODEL_DIR / "feature_columns.json", "w", encoding="utf-8") as file:
        json.dump(FEATURE_COLUMNS, file, indent=2)

    with open(METRICS_DIR / "credit_risk_metrics.json", "w", encoding="utf-8") as file:
        json.dump(
            {
                "best_model": best_model_name,
                "metrics": all_metrics,
                "training_records": int(len(df)),
                "feature_count": len(FEATURE_COLUMNS),
                "target_distribution": {str(k): int(v) for k, v in y.value_counts().to_dict().items()},
            },
            file,
            indent=2,
        )

    logger.info(f"Saved best model: {best_model_name}")


if __name__ == "__main__":
    main()
