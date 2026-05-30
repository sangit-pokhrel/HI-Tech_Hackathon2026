import pandas as pd
import networkx as nx

from src.common.config import RAW_DATA_DIR, PROCESSED_DATA_DIR
from src.common.constants import LOOKBACK_DAYS
from src.common.logger import logger
from src.scoring.fusion_score import calculate_rule_score


def safe_read(name: str) -> pd.DataFrame:
    path = RAW_DATA_DIR / f"{name}.csv"
    if not path.exists():
        logger.warning(f"Missing {path}; using empty DataFrame.")
        return pd.DataFrame()
    return pd.read_csv(path)


def clamp(value, min_value=0.0, max_value=1.0):
    if value is None or pd.isna(value):
        return min_value
    return max(min_value, min(max_value, float(value)))


def first_existing_col(df: pd.DataFrame, candidates: list[str]):
    for col in candidates:
        if col in df.columns:
            return col
    return None


def get_merchant_id(row: pd.Series) -> str:
    for key in ["_id", "merchant_id", "merchant_code"]:
        if key in row.index and pd.notna(row[key]):
            return str(row[key])
    raise ValueError("Merchant row has no ID column.")


def build_social_graph_scores(social_edges: pd.DataFrame) -> dict:
    if social_edges.empty:
        return {}

    source_col = first_existing_col(social_edges, ["source_merchant_id", "merchant_id"])
    target_col = first_existing_col(social_edges, ["target_entity_id", "target_id"])
    type_col = first_existing_col(social_edges, ["target_entity_type"])

    if not source_col or not target_col:
        return {}

    graph = nx.DiGraph()

    for _, edge in social_edges.iterrows():
        source = str(edge[source_col])
        target = str(edge[target_col])
        strength = float(edge.get("trust_strength", 1) or 1)
        graph.add_edge(source, target, weight=strength)

    if graph.number_of_nodes() == 0:
        return {}

    pagerank = nx.pagerank(graph, weight="weight")

    result = {}

    for node in graph.nodes:
        if not str(node).startswith("MRC"):
            continue

        merchant_edges = social_edges[social_edges[source_col].astype(str) == str(node)]

        total_edges = len(merchant_edges)
        unique_targets = merchant_edges[target_col].nunique() if total_edges else 0
        diversity = clamp(unique_targets / max(total_edges, 1))

        if type_col and "GUARANTOR" in merchant_edges[type_col].astype(str).values:
            guarantors = merchant_edges[merchant_edges[type_col] == "GUARANTOR"]
            guarantor_health = clamp(guarantors.get("trust_strength", pd.Series([4])).mean() / 10)
        else:
            guarantor_health = 0.4

        result[str(node)] = {
            "social_pagerank_score": clamp(pagerank.get(node, 0) * 20),
            "collusion_safety_score": diversity,
            "guarantor_health_score": guarantor_health,
            "collusion_risk_score": 1 - diversity,
        }

    return result


def build_features() -> pd.DataFrame:
    users = safe_read("users")
    merchants = safe_read("merchants")
    customers = safe_read("customers")
    transactions = safe_read("transactions")
    utility_payments = safe_read("utility_payments")
    wallet_activities = safe_read("wallet_activities")
    loan_applications = safe_read("loan_applications")
    repayment_records = safe_read("repayment_records")
    social_edges = safe_read("social_edges")
    psychometric_answers = safe_read("psychometric_answers")

    if merchants.empty:
        raise ValueError("merchants.csv is required. Run fetch_api_to_csv first.")

    graph_scores = build_social_graph_scores(social_edges)

    rows = []

    for _, merchant in merchants.iterrows():
        merchant_id = get_merchant_id(merchant)
        merchant_code = str(merchant.get("merchant_code", merchant_id))
        business_type = str(merchant.get("business_type", "OTHER"))

        tx_receiver_col = first_existing_col(transactions, ["receiver_code", "merchant_id", "receiver_id"])
        tx_sender_col = first_existing_col(transactions, ["sender_code", "customer_id", "sender_id"])

        if not transactions.empty and tx_receiver_col:
            merchant_tx = transactions[
                transactions[tx_receiver_col].astype(str).isin([merchant_id, merchant_code])
            ].copy()
        else:
            merchant_tx = pd.DataFrame()

        if not utility_payments.empty and "merchant_id" in utility_payments.columns:
            merchant_util = utility_payments[utility_payments["merchant_id"].astype(str) == merchant_id].copy()
        else:
            merchant_util = pd.DataFrame()

        if not wallet_activities.empty and "merchant_id" in wallet_activities.columns:
            merchant_wallet = wallet_activities[wallet_activities["merchant_id"].astype(str) == merchant_id].copy()
        else:
            merchant_wallet = pd.DataFrame()

        if not loan_applications.empty and "merchant_id" in loan_applications.columns:
            merchant_loans = loan_applications[loan_applications["merchant_id"].astype(str) == merchant_id].copy()
        else:
            merchant_loans = pd.DataFrame()

        if not repayment_records.empty and "merchant_id" in repayment_records.columns:
            merchant_repayments = repayment_records[repayment_records["merchant_id"].astype(str) == merchant_id].copy()
        else:
            merchant_repayments = pd.DataFrame()

        if not psychometric_answers.empty and "merchant_id" in psychometric_answers.columns:
            merchant_psy = psychometric_answers[psychometric_answers["merchant_id"].astype(str) == merchant_id].copy()
        else:
            merchant_psy = pd.DataFrame()

        # Transactions
        if not merchant_tx.empty and "transaction_time" in merchant_tx.columns:
            merchant_tx["transaction_time"] = pd.to_datetime(merchant_tx["transaction_time"], errors="coerce")
            active_days = merchant_tx["transaction_time"].dt.date.nunique()
        else:
            active_days = 0

        active_days_ratio = clamp(active_days / LOOKBACK_DAYS)

        if not merchant_tx.empty and "status" in merchant_tx.columns:
            success_tx = merchant_tx[merchant_tx["status"] == "SUCCESS"]
        else:
            success_tx = merchant_tx

        total_revenue = success_tx["amount"].sum() if not success_tx.empty and "amount" in success_tx.columns else 0
        monthly_revenue_avg = total_revenue / 6

        payment_channel_count = success_tx["payment_channel"].nunique() if not success_tx.empty and "payment_channel" in success_tx.columns else 1

        if not merchant_tx.empty and tx_sender_col:
            unique_customers = merchant_tx[tx_sender_col].nunique()
            total_tx = len(merchant_tx)
            transaction_gravity_score = clamp(unique_customers / 100)
            customer_diversity_score = clamp(unique_customers / max(total_tx, 1) * 5)
            repeat_counts = merchant_tx.groupby(tx_sender_col).size()
            repeat_customer_ratio = clamp((repeat_counts > 1).sum() / max(unique_customers, 1))
        else:
            transaction_gravity_score = 0
            customer_diversity_score = 0
            repeat_customer_ratio = 0

        refund_rate = 0
        if not merchant_tx.empty and "transaction_type" in merchant_tx.columns:
            refund_rate = len(merchant_tx[merchant_tx["transaction_type"] == "REFUND"]) / max(len(merchant_tx), 1)

        failed_payment_rate = 0
        if not merchant_tx.empty and "status" in merchant_tx.columns:
            failed_payment_rate = len(merchant_tx[merchant_tx["status"] == "FAILED"]) / max(len(merchant_tx), 1)

        transaction_growth_rate = (
            merchant_tx["transaction_growth_rate"].mean()
            if not merchant_tx.empty and "transaction_growth_rate" in merchant_tx.columns
            else 0
        )
        suspicious_spike_score = clamp(abs(transaction_growth_rate))

        supplier_payment_ratio = 0
        if not merchant_tx.empty and "transaction_type" in merchant_tx.columns and "amount" in merchant_tx.columns:
            supplier_outflow = merchant_tx[merchant_tx["transaction_type"] == "SUPPLIER_PAYMENT"]["amount"].sum()
            supplier_payment_ratio = clamp(supplier_outflow / max(merchant_tx["amount"].sum(), 1))

        # Wallet
        if not merchant_wallet.empty and "amount" in merchant_wallet.columns and "activity_type" in merchant_wallet.columns:
            money_in = merchant_wallet[merchant_wallet["activity_type"].isin(["PAYMENT_RECEIVED", "CASH_IN", "REMITTANCE_RECEIVED"])]["amount"].sum()
            money_out = merchant_wallet[merchant_wallet["activity_type"].isin(["CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT", "LOAN_REPAYMENT"])]["amount"].sum()
            wallet_velocity_score = clamp(min(money_in, money_out) / max(money_in, 1))

            cashout_amount = merchant_wallet[merchant_wallet["activity_type"] == "CASH_OUT"]["amount"].sum()
            cashout_speed_score = clamp(1 - (cashout_amount / max(merchant_wallet["amount"].sum(), 1)))
        else:
            wallet_velocity_score = 0.4
            cashout_speed_score = 0.6

        if not merchant_wallet.empty and "balance_after_transaction" in merchant_wallet.columns:
            avg_balance = merchant_wallet["balance_after_transaction"].mean()
            std_balance = merchant_wallet["balance_after_transaction"].std() or 0
            liquidity_buffer_score = clamp(1 - (std_balance / max(avg_balance, 1)))
        else:
            liquidity_buffer_score = 0.4

        # Utility and digital footprint
        utility_delay_avg = (
            merchant_util["days_late"].mean()
            if not merchant_util.empty and "days_late" in merchant_util.columns
            else 20
        )
        utility_calibration_score = clamp(1 - utility_delay_avg / 30)

        if not merchant_util.empty and "bill_type" in merchant_util.columns:
            airtime_count = len(merchant_util[merchant_util["bill_type"] == "MOBILE_TOPUP"])
            airtime_consistency_score = clamp(airtime_count / 30)

            internet = merchant_util[merchant_util["bill_type"] == "INTERNET"]
            if not internet.empty and "payment_status" in internet.columns:
                good_isp = len(internet[internet["payment_status"].isin(["ON_TIME", "PAID_EARLY"])])
                micro_obligation_score = clamp(good_isp / max(len(internet), 1))
            else:
                micro_obligation_score = 0.5
        else:
            airtime_consistency_score = 0.5
            micro_obligation_score = 0.5

        remittance_security_score = 0.0
        if not merchant_wallet.empty and "activity_type" in merchant_wallet.columns:
            remittance_amount = merchant_wallet[merchant_wallet["activity_type"] == "REMITTANCE_RECEIVED"]["amount"].sum()
            remittance_security_score = clamp(remittance_amount / 50000)

        # Loans and repayments
        requested_amount = (
            merchant_loans["requested_amount"].iloc[0]
            if not merchant_loans.empty and "requested_amount" in merchant_loans.columns
            else 0
        )
        loan_to_income_ratio = requested_amount / max(monthly_revenue_avg, 1)

        repayment_outcome = "GOOD"
        default_label = 0
        repayment_consistency_score = 0.6

        if not merchant_repayments.empty and "repayment_status" in merchant_repayments.columns:
            statuses = merchant_repayments["repayment_status"].astype(str)
            on_time = statuses.isin(["PAID_ON_TIME"]).sum()
            late = statuses.isin(["PAID_LATE", "MISSED"]).sum()
            default = statuses.isin(["DEFAULT"]).sum()
            repayment_consistency_score = clamp((on_time + late * 0.5) / max(len(statuses), 1))

            if default > 0:
                repayment_outcome = "DEFAULT"
                default_label = 1
            elif late > on_time:
                repayment_outcome = "LATE"

        # Psychometric
        if not merchant_psy.empty and "normalized_score" in merchant_psy.columns:
            psychometric_avg = merchant_psy["normalized_score"].mean()
        elif not merchant_psy.empty and "answer_score" in merchant_psy.columns:
            psychometric_avg = merchant_psy["answer_score"].mean() * 10
        else:
            # Neutral score until psychometric APIs are active
            psychometric_avg = 500

        conscientiousness_score = clamp(psychometric_avg / 1000)

        if not merchant_psy.empty and "consistency_flag" in merchant_psy.columns:
            risk_decision_consistency_score = clamp(1 - merchant_psy["consistency_flag"].mean())
        else:
            risk_decision_consistency_score = 0.5

        # Social graph
        graph = graph_scores.get(merchant_id, {})
        social_pagerank_score = graph.get("social_pagerank_score", 0.4)
        collusion_safety_score = graph.get("collusion_safety_score", 0.5)
        guarantor_health_score = graph.get("guarantor_health_score", 0.4)
        collusion_risk_score = graph.get("collusion_risk_score", 0.5)

        if business_type in ["AGRICULTURE", "VEGETABLE_SHOP", "FRUIT_SHOP"]:
            seasonal_pattern_score = 0.85
        else:
            seasonal_pattern_score = 0.45

        row = {
            "merchant_id": merchant_id,
            "merchant_code": merchant_code,
            "business_type": business_type,
            "wallet_age_months": merchant.get("wallet_age_months", 0),

            "monthly_revenue_avg": monthly_revenue_avg,
            "active_days": active_days,
            "active_days_ratio": active_days_ratio,
            "transaction_growth_rate": transaction_growth_rate,
            "payment_channel_count": payment_channel_count,
            "supplier_payment_ratio": supplier_payment_ratio,
            "wallet_velocity_score": wallet_velocity_score,

            "transaction_gravity_score": transaction_gravity_score,
            "liquidity_buffer_score": liquidity_buffer_score,
            "remittance_security_score": remittance_security_score,

            "airtime_consistency_score": airtime_consistency_score,
            "utility_calibration_score": utility_calibration_score,
            "micro_obligation_score": micro_obligation_score,

            "social_pagerank_score": social_pagerank_score,
            "collusion_safety_score": collusion_safety_score,
            "guarantor_health_score": guarantor_health_score,
            "collusion_risk_score": collusion_risk_score,

            "psychometric_avg": psychometric_avg,
            "conscientiousness_score": conscientiousness_score,
            "risk_decision_consistency_score": risk_decision_consistency_score,

            "customer_diversity_score": customer_diversity_score,
            "repeat_customer_ratio": repeat_customer_ratio,
            "refund_rate": refund_rate,
            "failed_payment_rate": failed_payment_rate,
            "cashout_speed_score": cashout_speed_score,
            "loan_to_income_ratio": loan_to_income_ratio,
            "suspicious_spike_score": suspicious_spike_score,
            "seasonal_pattern_score": seasonal_pattern_score,
            "repayment_consistency_score": repayment_consistency_score,

            "repayment_plan_daily_fit": 0.85 if business_type in ["TEA_SHOP", "SNACK_SHOP", "RESTAURANT"] else 0.35,
            "repayment_plan_weekly_fit": 0.85 if business_type in ["GROCERY", "PHARMACY", "VEGETABLE_SHOP"] else 0.45,
            "repayment_plan_seasonal_fit": 0.90 if business_type == "AGRICULTURE" else 0.20,

            "repayment_outcome": repayment_outcome,
            "default_label": default_label,
        }

        row.update(calculate_rule_score(row))
        rows.append(row)

    output = pd.DataFrame(rows)
    output_path = PROCESSED_DATA_DIR / "merchant_training_dataset.csv"
    output.to_csv(output_path, index=False)

    logger.info(f"Saved processed dataset: {output_path}")
    logger.info(f"Rows: {len(output)}")

    return output


def main():
    build_features()


if __name__ == "__main__":
    main()
