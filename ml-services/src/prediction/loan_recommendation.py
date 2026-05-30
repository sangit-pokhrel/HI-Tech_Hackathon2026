def get_risk_band(score: int) -> str:
    if score >= 850:
        return "PLATINUM"
    if score >= 720:
        return "GOLD"
    if score >= 580:
        return "SILVER"
    if score >= 420:
        return "BRONZE"
    if score >= 200:
        return "WATCH"
    return "THIN_FILE"


def get_decision(score: int, fraud_penalty: int) -> str:
    if fraud_penalty >= 180:
        return "REVIEW"
    if score >= 580:
        return "APPROVED"
    if score >= 420:
        return "REVIEW"
    if score >= 200:
        return "MICRO_CREDIT_ONLY"
    return "REJECTED"


def get_multiplier(band: str) -> float:
    return {
        "PLATINUM": 0.50,
        "GOLD": 0.35,
        "SILVER": 0.20,
        "BRONZE": 0.10,
        "WATCH": 0.05,
        "THIN_FILE": 0.00,
    }.get(band, 0.00)


def recommend_repayment_plan(row: dict) -> str:
    plans = {
        "DAILY": row.get("repayment_plan_daily_fit", 0),
        "WEEKLY": row.get("repayment_plan_weekly_fit", 0),
        "SEASONAL": row.get("repayment_plan_seasonal_fit", 0),
    }

    best = max(plans, key=plans.get)

    if plans[best] <= 0:
        return "NONE"

    return best


def recommend_loan(row: dict, final_score: int, fraud_penalty: int) -> dict:
    band = get_risk_band(final_score)
    decision = get_decision(final_score, fraud_penalty)

    monthly_revenue = float(row.get("monthly_revenue_avg", 0) or 0)
    suggested_amount = round(monthly_revenue * get_multiplier(band))

    if decision == "REJECTED":
        suggested_amount = 0
        repayment_plan = "NONE"
    else:
        repayment_plan = recommend_repayment_plan(row)

    return {
        "risk_band": band,
        "decision": decision,
        "suggested_loan_amount": suggested_amount,
        "repayment_plan": repayment_plan,
    }
