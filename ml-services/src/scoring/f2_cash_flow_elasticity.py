import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f2_cash_flow_elasticity(row: dict) -> int:
    '''
    F2: Cash Flow Elasticity & Alternative Liquidity
    Max = 180
    - Transaction gravity: 60
    - Liquidity buffer: 60
    - Remittance-backed security: 60
    '''
    transaction_gravity = clamp(row.get("transaction_gravity_score", 0))
    liquidity_buffer = clamp(row.get("liquidity_buffer_score", 0))
    remittance_security = clamp(row.get("remittance_security_score", 0))

    return round(transaction_gravity * 60 + liquidity_buffer * 60 + remittance_security * 60)
