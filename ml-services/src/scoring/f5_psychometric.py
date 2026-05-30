import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f5_psychometric(row: dict) -> int:
    '''
    F5: Psychometric Calibration
    Max = 200
    - Conscientiousness: 100
    - Risk decision consistency: 100
    '''
    conscientiousness = clamp(row.get("conscientiousness_score", 0.5))
    risk_consistency = clamp(row.get("risk_decision_consistency_score", 0.5))

    return round(conscientiousness * 100 + risk_consistency * 100)
