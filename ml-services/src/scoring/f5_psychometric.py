import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f5_psychometric(row: dict) -> int:
    '''
    F5: Accessible Psychometric Calibration
    Max = 200

    F5.1 Conscientiousness = 100
    F5.2 Risk aversion and decision consistency = 100

    If psychometric data is not available yet, the feature builder gives neutral scores.
    '''
    conscientiousness = clamp(row.get("conscientiousness_score", 0.5))
    risk_consistency = clamp(row.get("risk_decision_consistency_score", 0.5))

    return round(conscientiousness * 100 + risk_consistency * 100)
