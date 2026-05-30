from src.scoring.f1_livelihood_rhythm import score_f1_livelihood_rhythm
from src.scoring.f2_cash_flow_elasticity import score_f2_cash_flow_elasticity
from src.scoring.f3_smart_digital_footprint import score_f3_smart_digital_footprint
from src.scoring.f4_community_trust_graph import score_f4_community_trust_graph
from src.scoring.f5_psychometric import score_f5_psychometric
from src.scoring.fraud_penalty import calculate_fraud_penalty


def calculate_rule_score(row: dict) -> dict:
    f1 = score_f1_livelihood_rhythm(row)
    f2 = score_f2_cash_flow_elasticity(row)
    f3 = score_f3_smart_digital_footprint(row)
    f4 = score_f4_community_trust_graph(row)
    f5 = score_f5_psychometric(row)

    fraud_penalty, fraud_flags = calculate_fraud_penalty(row)

    final_score = f1 + f2 + f3 + f4 + f5 - fraud_penalty
    final_score = max(0, min(1000, round(final_score)))

    return {
        "f1_livelihood_rhythm": f1,
        "f2_cash_flow_elasticity": f2,
        "f3_smart_digital_footprint": f3,
        "f4_community_trust_graph": f4,
        "f5_psychometric": f5,
        "fraud_penalty": fraud_penalty,
        "fraud_flags": fraud_flags,
        "rule_based_sajilo_score": final_score,
    }
