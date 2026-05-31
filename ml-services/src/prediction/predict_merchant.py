import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from src.common.config import METRICS_DIR, MODEL_DIR, PREDICTIONS_DIR, PROCESSED_DATA_DIR
from src.prediction.loan_recommendation import recommend_loan
from src.scoring.fusion_score import calculate_rule_score


def load_dataset() -> pd.DataFrame:
    path = PROCESSED_DATA_DIR / "merchant_training_dataset.csv"
    if not path.exists():
        raise FileNotFoundError("merchant_training_dataset.csv not found. Run build_features first.")
    return pd.read_csv(path)


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, float(value)))


def get_positive_factors(row: dict) -> list[str]:
    factors = []

    if row.get("active_days_ratio", 0) > 0.6:
        factors.append("Consistent livelihood rhythm")

    if row.get("wallet_velocity_score", 0) > 0.6:
        factors.append("Healthy wallet velocity")

    if row.get("utility_calibration_score", 0) > 0.7:
        factors.append("Reliable smart digital footprint")

    if row.get("social_pagerank_score", 0) > 0.5:
        factors.append("Healthy community trust graph")

    if row.get("psychometric_avg", 0) > 700:
        factors.append("Strong psychometric profile")

    return factors


def get_risk_factors(row: dict) -> list[str]:
    risks = []

    if row.get("refund_rate", 0) > 0.12:
        risks.append("High refund rate")

    if row.get("customer_diversity_score", 1) < 0.2:
        risks.append("Low customer diversity")

    if row.get("suspicious_spike_score", 0) > 0.75:
        risks.append("Suspicious transaction spike")

    if row.get("cashout_speed_score", 1) < 0.25:
        risks.append("Fast cash-out behaviour")

    if row.get("collusion_risk_score", 0) > 0.70:
        risks.append("Possible social graph collusion risk")

    return risks


def load_model_metadata() -> dict:
    metrics_path = METRICS_DIR / "credit_risk_metrics.json"
    if not metrics_path.exists():
        return {
            "best_model": "unavailable",
            "training_records": 0,
            "metrics": {},
        }

    with open(metrics_path, encoding="utf-8") as file:
        return json.load(file)


def run_model_probability(features: dict) -> tuple[float, dict]:
    model_path = MODEL_DIR / "credit_risk_model.pkl"
    feature_path = MODEL_DIR / "feature_columns.json"
    metadata = load_model_metadata()

    if model_path.exists() and feature_path.exists():
        model = joblib.load(model_path)
        with open(feature_path, encoding="utf-8") as file:
            feature_columns = json.load(file)

        x = pd.DataFrame([features]).reindex(columns=feature_columns, fill_value=0).fillna(0)

        if hasattr(model, "predict_proba"):
            default_probability = float(model.predict_proba(x)[0][1])
        else:
            default_probability = float(model.predict(x)[0])

        return default_probability, metadata

    rule_score = float(features.get("rule_based_nagarik_credits_score", 500))
    return 1 - (rule_score / 1000), metadata


def blend_scores(rule_based_score: int, ml_repayment_score: int, fraud_penalty: int, metadata: dict) -> tuple[int, dict]:
    training_records = int(metadata.get("training_records", 0) or 0)

    downgrade_weight = clamp(training_records / 200.0, 0.05, 0.40)
    uplift_weight = 0.40 if training_records > 0 else 0.25

    if ml_repayment_score >= rule_based_score:
        model_weight = uplift_weight
    else:
        model_weight = downgrade_weight

    if fraud_penalty >= 120 and ml_repayment_score > rule_based_score:
        model_weight = min(model_weight, 0.20)

    rule_weight = 1 - model_weight
    final_score = round((rule_based_score * rule_weight) + (ml_repayment_score * model_weight))
    final_score = max(0, min(1000, final_score))

    return final_score, {
        "training_records": training_records,
        "rule_weight": round(rule_weight, 4),
        "model_weight": round(model_weight, 4),
        "best_model": metadata.get("best_model", "unavailable"),
    }


def save_prediction(result: dict) -> None:
    out_path = PREDICTIONS_DIR / f"{result['merchant_id']}_prediction.json"
    with open(out_path, "w", encoding="utf-8") as file:
        json.dump(result, file, indent=2)


def calculate_psychometric_baseline_score(features: dict) -> tuple[int, int, float, float]:
    psychometric_avg = float(features.get("psychometric_avg", 0) or 0)
    conscientiousness = float(features.get("conscientiousness_score", 0.5) or 0.5)
    risk_consistency = float(features.get("risk_decision_consistency_score", 0.5) or 0.5)

    f5_psychometric = round((psychometric_avg / 1000) * 180)
    behavioural_bonus = round(((conscientiousness + risk_consistency) / 2) * 40)
    raw_baseline = f5_psychometric + behavioural_bonus
    final_score = min(round(raw_baseline * (550 / 220)), 550)
    final_score = max(final_score, 100)
    return final_score, f5_psychometric, psychometric_avg, conscientiousness


def build_zero_history_result(features: dict, fraud_penalty: int) -> dict:
    final_score, f5_psychometric, psychometric_avg, conscientiousness = calculate_psychometric_baseline_score(features)
    risk_consistency = float(features.get("risk_decision_consistency_score", 0.5) or 0.5)

    repayment_probability = round(min((psychometric_avg / 1000) * 0.80, 0.80), 4)
    default_probability = round(1 - repayment_probability, 4)
    ml_repayment_score = round(repayment_probability * 1000)

    loan = recommend_loan(features, final_score, fraud_penalty)

    positive_factors = []
    risk_factors = ["No digital transaction history yet - score will improve with usage"]
    if psychometric_avg >= 700:
        positive_factors.append("Strong psychometric behavioral profile")
    if conscientiousness >= 0.7:
        positive_factors.append("High conscientiousness score")
    if risk_consistency >= 0.7:
        positive_factors.append("Consistent risk decision-making")
    if psychometric_avg < 400:
        risk_factors.append("Low psychometric signal strength")

    return {
        "merchant_id": str(features.get("merchant_id", "REALTIME")),
        "merchant_code": str(features.get("merchant_code", "REALTIME")),
        "merchant_user_id": str(features.get("merchant_user_id", "REALTIME")),
        "scores": {
            "f1_livelihood_rhythm": 0,
            "f2_cash_flow_elasticity": 0,
            "f3_smart_digital_footprint": 0,
            "f4_community_trust_graph": 0,
            "f5_psychometric": f5_psychometric,
            "fraud_penalty": fraud_penalty,
            "rule_based_nagarik_credits_score": final_score,
            "ml_repayment_score": ml_repayment_score,
            "final_nagarik_credits_score": final_score,
        },
        "probabilities": {
            "default_probability": default_probability,
            "repayment_probability": repayment_probability,
        },
        "loan_recommendation": loan,
        "score_mix": {
            "training_records": 0,
            "rule_weight": 1.0,
            "model_weight": 0.0,
            "best_model": "psychometric_baseline",
        },
        "explanation": {
            "summary": (
                f"New profile with no transaction history. Nagarik Credits score of {final_score} "
                f"is anchored on psychometric behavioral signals (avg: {round(psychometric_avg)}). "
                "Score will improve as digital transactions build up."
            ),
            "positive_factors": positive_factors,
            "risk_factors": risk_factors,
        },
        "predicted_at": datetime.now(timezone.utc).isoformat(),
    }


def build_prediction_result(features: dict, rule_metrics: dict) -> dict:
    active_days = float(features.get("active_days", 0) or 0)
    monthly_revenue = float(features.get("monthly_revenue_avg", 0) or 0)
    fraud_penalty = int(rule_metrics["fraud_penalty"])

    if active_days == 0 and monthly_revenue == 0:
        return build_zero_history_result(features, fraud_penalty)

    rule_based_score = int(rule_metrics["rule_based_nagarik_credits_score"])
    default_probability, metadata = run_model_probability(features)
    repayment_probability = 1 - default_probability
    ml_repayment_score = round(repayment_probability * 1000)
    final_score, score_mix = blend_scores(rule_based_score, ml_repayment_score, fraud_penalty, metadata)

    thin_file_floor, _, _, _ = calculate_psychometric_baseline_score(features)
    active_days = float(features.get("active_days", 0) or 0)
    transaction_gravity = float(features.get("transaction_gravity_score", 0) or 0)
    monthly_revenue = float(features.get("monthly_revenue_avg", 0) or 0)
    if active_days <= 2 and transaction_gravity <= 0.1 and monthly_revenue <= 5000 and fraud_penalty < 100:
        final_score = max(final_score, thin_file_floor)

    loan = recommend_loan(features, final_score, fraud_penalty)

    return {
        "merchant_id": str(features.get("merchant_id", "REALTIME")),
        "merchant_code": str(features.get("merchant_code", "REALTIME")),
        "merchant_user_id": str(features.get("merchant_user_id", "REALTIME")),
        "scores": {
            "f1_livelihood_rhythm": int(rule_metrics["f1_livelihood_rhythm"]),
            "f2_cash_flow_elasticity": int(rule_metrics["f2_cash_flow_elasticity"]),
            "f3_smart_digital_footprint": int(rule_metrics["f3_smart_digital_footprint"]),
            "f4_community_trust_graph": int(rule_metrics["f4_community_trust_graph"]),
            "f5_psychometric": int(rule_metrics["f5_psychometric"]),
            "fraud_penalty": fraud_penalty,
            "rule_based_nagarik_credits_score": rule_based_score,
            "ml_repayment_score": ml_repayment_score,
            "final_nagarik_credits_score": final_score,
        },
        "probabilities": {
            "default_probability": round(default_probability, 4),
            "repayment_probability": round(repayment_probability, 4),
        },
        "loan_recommendation": loan,
        "score_mix": score_mix,
        "explanation": {
            "summary": (
                f"Real-time prediction received a Nagarik Credits of {final_score}. "
                f"The decision is {loan['decision']} with {loan['repayment_plan']} repayment."
            ),
            "positive_factors": get_positive_factors(features),
            "risk_factors": get_risk_factors(features),
        },
        "predicted_at": datetime.now(timezone.utc).isoformat(),
    }


def predict_merchant(merchant_id: str) -> dict:
    df = load_dataset()
    merchant_rows = df[df["merchant_id"].astype(str) == str(merchant_id)]

    if merchant_rows.empty and "merchant_code" in df.columns:
        merchant_rows = df[df["merchant_code"].astype(str) == str(merchant_id)]

    if merchant_rows.empty and "merchant_user_id" in df.columns:
        merchant_rows = df[df["merchant_user_id"].astype(str) == str(merchant_id)]

    if merchant_rows.empty:
        raise ValueError(f"Merchant not found in processed dataset: {merchant_id}")

    row = merchant_rows.iloc[0].to_dict()
    rule_metrics = {
        "f1_livelihood_rhythm": int(row.get("f1_livelihood_rhythm", 0)),
        "f2_cash_flow_elasticity": int(row.get("f2_cash_flow_elasticity", 0)),
        "f3_smart_digital_footprint": int(row.get("f3_smart_digital_footprint", 0)),
        "f4_community_trust_graph": int(row.get("f4_community_trust_graph", 0)),
        "f5_psychometric": int(row.get("f5_psychometric", 0)),
        "fraud_penalty": int(row.get("fraud_penalty", 0)),
        "fraud_flags": row.get("fraud_flags", []),
        "rule_based_nagarik_credits_score": int(row.get("rule_based_nagarik_credits_score", 0)),
    }

    result = build_prediction_result(row, rule_metrics)
    save_prediction(result)
    return result


def predict_realtime(features: dict) -> dict:
    rule_metrics = calculate_rule_score(features)
    features.update(rule_metrics)

    result = build_prediction_result(features, rule_metrics)
    return result
