def calculate_fraud_penalty(row: dict) -> tuple[int, list[str]]:
    penalty = 0
    flags: list[str] = []

    if row.get("refund_rate", 0) > 0.12:
        penalty += 40
        flags.append("High refund rate")

    if row.get("failed_payment_rate", 0) > 0.10:
        penalty += 30
        flags.append("High failed payment rate")

    if row.get("customer_diversity_score", 1) < 0.20:
        penalty += 40
        flags.append("Low customer diversity")

    if row.get("suspicious_spike_score", 0) > 0.75:
        penalty += 60
        flags.append("Suspicious transaction spike")

    if row.get("cashout_speed_score", 1) < 0.25:
        penalty += 40
        flags.append("Fast cash-out behaviour")

    if row.get("collusion_risk_score", 0) > 0.70:
        penalty += 70
        flags.append("Possible social graph collusion risk")

    return min(penalty, 250), flags
