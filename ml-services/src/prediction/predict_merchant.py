import json
import joblib
import pandas as pd
from datetime import datetime, timezone

from src.common.config import PROCESSED_DATA_DIR, MODEL_DIR, PREDICTIONS_DIR
from src.prediction.loan_recommendation import recommend_loan
from src.scoring.fusion_score import calculate_rule_score


def load_dataset() -> pd.DataFrame:
    path = PROCESSED_DATA_DIR / "merchant_training_dataset.csv"
    if not path.exists():
        raise FileNotFoundError("merchant_training_dataset.csv not found. Run build_features first.")
    return pd.read_csv(path)


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

    # Check for completely brand new user/merchant with zero transactions
    active_days = float(row.get("active_days", 0) or 0)
    monthly_revenue = float(row.get("monthly_revenue_avg", 0) or 0)

    if active_days == 0 and monthly_revenue == 0:
        final_score = 0
        fraud_penalty = int(row.get("fraud_penalty", 0))
        loan = recommend_loan(row, final_score, fraud_penalty)
        result = {
            "merchant_id": str(row["merchant_id"]),
            "merchant_code": str(row.get("merchant_code", "")),
            "merchant_user_id": str(row.get("merchant_user_id", "")),
            "scores": {
                "f1_livelihood_rhythm": 0,
                "f2_cash_flow_elasticity": 0,
                "f3_smart_digital_footprint": 0,
                "f4_community_trust_graph": 0,
                "f5_psychometric": 0,
                "fraud_penalty": fraud_penalty,
                "rule_based_nagarik_credits_score": 0,
                "ml_repayment_score": 0,
                "final_nagarik_credits_score": 0,
            },
            "probabilities": {
                "default_probability": 1.0,
                "repayment_probability": 0.0,
            },
            "loan_recommendation": loan,
            "explanation": {
                "summary": (
                    f"Merchant {row['merchant_id']} is a brand new account with no transaction history. "
                    f"The decision is {loan['decision']} with {loan['repayment_plan']} repayment due to THIN_FILE status."
                ),
                "positive_factors": [],
                "risk_factors": ["No transaction history detected", "Thin file profile"],
            },
            "predicted_at": datetime.now(timezone.utc).isoformat(),
        }
        # Save latest prediction output for audit/demo.
        out_path = PREDICTIONS_DIR / f"{result['merchant_id']}_prediction.json"
        with open(out_path, "w", encoding="utf-8") as file:
            json.dump(result, file, indent=2)
        return result

    model_path = MODEL_DIR / "credit_risk_model.pkl"
    feature_path = MODEL_DIR / "feature_columns.json"

    if model_path.exists() and feature_path.exists():
        model = joblib.load(model_path)
        with open(feature_path, encoding="utf-8") as file:
            feature_columns = json.load(file)

        x = pd.DataFrame([row])[feature_columns].fillna(0)

        if hasattr(model, "predict_proba"):
            default_probability = float(model.predict_proba(x)[0][1])
        else:
            default_probability = float(model.predict(x)[0])
    else:
        # Rule-based fallback before training.
        rule_score = float(row.get("rule_based_nagarik_credits_score", 500))
        default_probability = 1 - (rule_score / 1000)

    repayment_probability = 1 - default_probability
    ml_repayment_score = round(repayment_probability * 1000)

    rule_based_score = int(row.get("rule_based_nagarik_credits_score", ml_repayment_score))
    fraud_penalty = int(row.get("fraud_penalty", 0))

    final_score = round((rule_based_score * 0.60) + (ml_repayment_score * 0.40))
    final_score = max(0, min(1000, final_score))

    loan = recommend_loan(row, final_score, fraud_penalty)

    result = {
        "merchant_id": str(row["merchant_id"]),
        "merchant_code": str(row.get("merchant_code", "")),
        "merchant_user_id": str(row.get("merchant_user_id", "")),
        "scores": {
            "f1_livelihood_rhythm": int(row.get("f1_livelihood_rhythm", 0)),
            "f2_cash_flow_elasticity": int(row.get("f2_cash_flow_elasticity", 0)),
            "f3_smart_digital_footprint": int(row.get("f3_smart_digital_footprint", 0)),
            "f4_community_trust_graph": int(row.get("f4_community_trust_graph", 0)),
            "f5_psychometric": int(row.get("f5_psychometric", 0)),
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
        "explanation": {
            "summary": (
                f"Merchant {row['merchant_id']} received a Nagarik Credits of {final_score}. "
                f"The decision is {loan['decision']} with {loan['repayment_plan']} repayment."
            ),
            "positive_factors": get_positive_factors(row),
            "risk_factors": get_risk_factors(row),
        },
        "predicted_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save latest prediction output for audit/demo.
    out_path = PREDICTIONS_DIR / f"{result['merchant_id']}_prediction.json"
    with open(out_path, "w", encoding="utf-8") as file:
        json.dump(result, file, indent=2)

    return result


def predict_realtime(features: dict) -> dict:
    # 1. Compute deterministic score metrics first & merge them back into the features dict
    rule_metrics = calculate_rule_score(features)
    features.update(rule_metrics)
    
    # Check for completely brand new user/merchant with zero transactions
    active_days = float(features.get("active_days", 0) or 0)
    monthly_revenue = float(features.get("monthly_revenue_avg", 0) or 0)

    if active_days == 0 and monthly_revenue == 0:
        final_score = 0
        fraud_penalty = int(rule_metrics["fraud_penalty"])
        loan = recommend_loan(features, final_score, fraud_penalty)
        result = {
            "merchant_id": str(features.get("merchant_id", "REALTIME")),
            "merchant_code": str(features.get("merchant_code", "REALTIME")),
            "merchant_user_id": str(features.get("merchant_user_id", "REALTIME")),
            "scores": {
                "f1_livelihood_rhythm": 0,
                "f2_cash_flow_elasticity": 0,
                "f3_smart_digital_footprint": 0,
                "f4_community_trust_graph": 0,
                "f5_psychometric": 0,
                "fraud_penalty": fraud_penalty,
                "rule_based_nagarik_credits_score": 0,
                "ml_repayment_score": 0,
                "final_nagarik_credits_score": 0,
            },
            "probabilities": {
                "default_probability": 1.0,
                "repayment_probability": 0.0,
            },
            "loan_recommendation": loan,
            "explanation": {
                "summary": (
                    f"Real-time prediction received a Nagarik Credits of 0. "
                    f"The decision is {loan['decision']} with {loan['repayment_plan']} repayment due to THIN_FILE status."
                ),
                "positive_factors": [],
                "risk_factors": ["No transaction history detected", "Thin file profile"],
            },
            "predicted_at": datetime.now(timezone.utc).isoformat(),
        }
        return result

    rule_based_score = int(rule_metrics["rule_based_nagarik_credits_score"])
    fraud_penalty = int(rule_metrics["fraud_penalty"])

    # 2. Perform ML model prediction with fully enriched features
    model_path = MODEL_DIR / "credit_risk_model.pkl"
    feature_path = MODEL_DIR / "feature_columns.json"

    if model_path.exists() and feature_path.exists():
        model = joblib.load(model_path)
        with open(feature_path, encoding="utf-8") as file:
            feature_columns = json.load(file)

        x = pd.DataFrame([features])[feature_columns].fillna(0)

        if hasattr(model, "predict_proba"):
            default_probability = float(model.predict_proba(x)[0][1])
        else:
            default_probability = float(model.predict(x)[0])
    else:
        # Rule-based fallback before training.
        rule_score = float(features.get("rule_based_nagarik_credits_score", 500))
        default_probability = 1 - (rule_score / 1000)

    repayment_probability = 1 - default_probability
    ml_repayment_score = round(repayment_probability * 1000)

    final_score = round((rule_based_score * 0.60) + (ml_repayment_score * 0.40))
    final_score = max(0, min(1000, final_score))

    loan = recommend_loan(features, final_score, fraud_penalty)

    result = {
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

    return result
