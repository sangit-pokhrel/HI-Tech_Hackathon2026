import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f1_livelihood_rhythm(row: dict) -> int:
    '''
    F1: Livelihood Rhythm & Transaction Consistency
    Max = 200

    F1.1 Sector-calibrated livelihood cycle = 80
    F1.2 B2B supplier integration = 60
    F1.3 Digital wallet velocity = 60
    '''
    business_type = row.get("business_type", "OTHER")

    active_days_ratio = clamp(row.get("active_days_ratio", 0))
    seasonal_pattern_score = clamp(row.get("seasonal_pattern_score", 0.4))
    supplier_payment_ratio = clamp(row.get("supplier_payment_ratio", 0))
    wallet_velocity_score = clamp(row.get("wallet_velocity_score", 0))

    daily_types = {
        "TEA_SHOP", "GROCERY", "RESTAURANT", "SNACK_SHOP",
        "PHARMACY", "DAIRY_SHOP", "BAKERY"
    }

    seasonal_types = {"AGRICULTURE", "VEGETABLE_SHOP", "FRUIT_SHOP"}

    if business_type in seasonal_types:
        cycle_score = seasonal_pattern_score * 80
    elif business_type in daily_types:
        cycle_score = active_days_ratio * 80
    else:
        cycle_score = ((active_days_ratio * 0.7) + (seasonal_pattern_score * 0.3)) * 80

    supplier_score = supplier_payment_ratio * 60
    velocity_score = wallet_velocity_score * 60

    return round(cycle_score + supplier_score + velocity_score)
