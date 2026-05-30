import pandas as pd

def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def score_f4_community_trust_graph(row: dict) -> int:
    '''
    F4: Community Trust Graph & Social Capital
    Max = 200

    F4.1 Social Trust PageRank = 80
    F4.2 Collusion/circular loop safety = 60
    F4.3 Digital guarantor health = 60
    '''
    pagerank = clamp(row.get("social_pagerank_score", 0))
    collusion_safety = clamp(row.get("collusion_safety_score", 0.5))
    guarantor_health = clamp(row.get("guarantor_health_score", 0.4))

    return round(pagerank * 80 + collusion_safety * 60 + guarantor_health * 60)
