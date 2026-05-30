import json
import joblib
import pandas as pd

from src.common.config import PROCESSED_DATA_DIR, MODEL_DIR
from src.prediction.loan_recommendation import recommend_loan


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
    rows = df[df["merchant_id"].astype(str) == str(merchant_id)]

    if rows.empty:
        # fallback also check merchant_code if exists
        if "merchant_code" in df.columns:
            rows = df[df["merchant_code"].astype(str) == str(merchant_id)]

    if rows.empty:
        raise ValueError(f"Merchant not found in processed dataset: {merchant_id}")

    row = rows.iloc[0].to_dict()

    model_path = MODEL_DIR / "credit_risk_model.pkl"
    features_path = MODEL_DIR / "feature_columns.json"

    if model_path.exists() and features_path.exists():
        model = joblib.load(model_path)
        with open(features_path) as f:
            feature_columns = json.load(f)

        x = pd.DataFrame([row])[feature_columns].fillna(0)

        if hasattr(model, "predict_proba"):
            default_probability = float(model.predict_proba(x)[0][1])
        else:
            default_probability = float(model.predict(x)[0])
    else:
        # fallback if model has not been trained yet
        default_probability = 1 - (float(row.get("rule_based_sajilo_score", 500)) / 1000)

    repayment_probability = 1 - default_probability
    ml_repayment_score = round(repayment_probability * 1000)

    rule_score = int(row.get("rule_based_sajilo_score", ml_repayment_score))
    fraud_penalty = int(row.get("fraud_penalty", 0))

    # Blend rule engine and ML output
    final_score = round((rule_score * 0.60) + (ml_repayment_score * 0.40))
    final_score = max(0, min(1000, final_score))

    loan = recommend_loan(row, final_score, fraud_penalty)

    return {
        "merchant_id": str(row["merchant_id"]),
        "scores": {
            "f1_livelihood_rhythm": int(row.get("f1_livelihood_rhythm", 0)),
            "f2_cash_flow_elasticity": int(row.get("f2_cash_flow_elasticity", 0)),
            "f3_smart_digital_footprint": int(row.get("f3_smart_digital_footprint", 0)),
            "f4_community_trust_graph": int(row.get("f4_community_trust_graph", 0)),
            "f5_psychometric": int(row.get("f5_psychometric", 0)),
            "fraud_penalty": fraud_penalty,
            "rule_based_sajilo_score": rule_score,
            "ml_repayment_score": ml_repayment_score,
            "final_sajilo_score": final_score,
        },
        "probabilities": {
            "default_probability": round(default_probability, 4),
            "repayment_probability": round(repayment_probability, 4),
        },
        "loan_recommendation": loan,
        "explanation": {
            "summary": (
                f"Merchant {row['merchant_id']} received a SajiloScore of {final_score}. "
                f"The decision is {loan['decision']} with {loan['repayment_plan']} repayment."
            ),
            "positive_factors": get_positive_factors(row),
            "risk_factors": get_risk_factors(row),
        },
    }
