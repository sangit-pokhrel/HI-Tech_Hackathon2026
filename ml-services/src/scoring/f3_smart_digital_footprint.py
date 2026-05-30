import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f3_smart_digital_footprint(row: dict) -> int:
    '''
    F3: Smart Digital Footprint
    Max = 220
    - Airtime/mobile top-up consistency: 80
    - Utility calibration: 80
    - Micro-obligation adherence: 60
    '''
    airtime = clamp(row.get("airtime_consistency_score", 0))
    utility = clamp(row.get("utility_calibration_score", 0))
    micro_obligation = clamp(row.get("micro_obligation_score", 0))

    return round(airtime * 80 + utility * 80 + micro_obligation * 60)
