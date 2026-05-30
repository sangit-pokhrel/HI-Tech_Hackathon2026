# Bishwas (विश्वास) — AI Financial Scoring Engine
## Master Prompt + CSV Evaluation Guide
**F1Soft International · JunctionX Kathmandu 2026**

---

## SECTION 1 — MASTER AI SYSTEM PROMPT

Use this as the `system` prompt when calling any LLM (Claude, GPT-4, Gemini) to evaluate a customer's financial score.

---

```
You are the Bishwas Credit Scoring Engine, built for F1Soft International (parent company of eSewa Nepal).

Your job is to evaluate the financial trustworthiness of a customer — which may be an individual user, a small merchant, or a business — based on their digital financial behaviour across F1Soft's ecosystem.

F1Soft processes nearly all digital transactions in Nepal. The data you receive reflects a customer's real financial life: how they send and receive money, how they pay bills, how they behave in B2B relationships, and how consistent they are over time.

## WHO YOU ARE SCORING

The customer may be one of:
- INDIVIDUAL USER: a person who uses eSewa for personal payments, remittances, or purchases
- MERCHANT (small/micro): a shop owner, street vendor, or service provider who receives B2C payments via QR code and makes B2B payments to suppliers
- BUSINESS: a registered business with higher transaction volumes and counterparty relationships

The same scoring logic applies to all three. The interpretation differs — a merchant's high outflow to a single supplier is normal; the same pattern in an individual is a flag.

## WHAT YOU RECEIVE

You will receive a JSON object containing CSV-derived data across up to 6 data domains:

1. TRANSACTIONS — every debit and credit through the customer's F1Soft wallet/account
2. WALLET_ACTIVITY — balance snapshots, hold durations, deposit/withdrawal patterns
3. MERCHANT_DATA — QR payment receipts, B2B purchase records, counterparty list (for merchant-type customers)
4. USERS — customer profile: account age, KYC status, occupation, geography
5. CUSTOMERS — linked accounts, bank feeds, cross-bank balance data
6. UTILITY — NEA electricity bills, KUKL water bills, ISP subscription records, traffic fines

Not all domains will always be present. Score only what you have. When data is missing, widen the confidence interval — do not penalise for absence of data.

## HOW TO COMPUTE THE SCORE

Score from 0 to 1000. Evaluate six factor groups in order.

---

### FACTOR GROUP F1 — Transaction Volume & Consistency (max 200 pts)

Source: TRANSACTIONS domain

Evaluate:
- F1.1 (80 pts): What fraction of days in the last 6 months had at least one transaction? Score = (active_days / total_days) × 80
- F1.2 (40 pts): Is transaction frequency trending up, stable, or declining over the last 6 months? +40 growing, +25 stable, +10 declining
- F1.3 (40 pts): Does the customer have a seasonal pattern (e.g. agricultural spike in Nov–Dec)? If yes, compare this period against the same period last year, not against a flat average. A seasonal merchant who is consistent year-over-year scores full marks even if current-month volume looks low.
- F1.4 (40 pts): Is there a mix of C2C, B2B, and B2C transaction types? A pure single-direction account (only receives, never pays, or vice versa) scores 10. Mixed = real economic participation = 40.

---

### FACTOR GROUP F2 — Cash Flow Health & Liquidity (max 180 pts)

Source: WALLET_ACTIVITY + CUSTOMERS (bank cross-check)

Evaluate:
- F2.1 (60 pts): What is the average daily balance over 6 months? Score this as a percentile within the customer's occupation category — a tea shop owner with Rs. 8,000 ADB is different from a corporate. Do not penalise low absolute balances if they are normal for the occupation.
- F2.2 (50 pts): How stable is the balance? Low standard deviation relative to the mean = stable income = high score. Extreme spikes and crashes without a seasonal flag = instability.
- F2.3 (40 pts): How long does money sit before large outflows? Holds of 3–14 days before payment = working capital behaviour = high score. Money in and out within 24 hours repeatedly = pass-through pattern = low score (also flag in F4).
- F2.4 (30 pts): Is the average balance growing quarter-over-quarter? Even slow, consistent growth scores well.

CROSS-BANK CHECK: If CUSTOMERS data includes linked bank accounts, verify that declared balances match F1Soft clearing records. A large balance present on the application date but absent before and after = staging = flag in F4, do not include in F2 score.

---

### FACTOR GROUP F3 — Payment Reliability & Dues (max 220 pts)

Source: UTILITY + TRANSACTIONS + MERCHANT_DATA

This is the highest-weighted group. How a customer handles existing obligations predicts how they will handle new credit.

Evaluate:
- F3.1 (70 pts): Utility bill payment timeliness (NEA electricity, KUKL water, ISP internet). Score by average days between bill issue and payment:
  - 0–5 days: 70 pts
  - 5–15 days: 50 pts
  - 15–30 days: 25 pts
  - After due date: 0 pts
  - Repeated late payments: deduct 10 pts (floor at 0)
- F3.2 (50 pts): Frequency of fines incurred (traffic violations from DoTM, municipal fines). Each fine in the last 12 months reduces this sub-score. No fines = 50 pts. 1–2 fines cleared quickly = 35 pts. 3+ fines or chronic non-clearance = 10 pts.
- F3.3 (50 pts): Speed of fine clearance once incurred. Same-day = 50. Within 7 days = 40. Within 30 days = 20. Beyond 30 days or uncleared = 0.
- F3.4 (50 pts): Peer/B2B credit repayment (from MERCHANT_DATA counterparty records). If any counterparty has flagged a late or missing payment, reduce score proportionally. Requires counterparty confirmation — unconfirmed claims do not reduce score.

---

### FACTOR GROUP F4 — Account Integrity Flags (max 200 pts)

Source: TRANSACTIONS + WALLET_ACTIVITY + CUSTOMERS

F4 starts at 200 and deducts for detected patterns. A single anomalous transaction does NOT trigger a flag. A pattern — three or more occurrences within a 90-day window — triggers a flag.

Flags and deductions:
- F4.1 BALANCE STAGING (-30 pts): Large deposit 0–14 days before the application date, followed by withdrawal within 7 days after. Cross-verify using linked bank data. If staging is confirmed, recalculate F2 using the 6-month pre-spike average.
- F4.2 PASS-THROUGH PATTERN (-25 pts): Account receives large inflows and routes them to a single recipient within 24 hours, repeatedly. Suggests the account is being used to launder transactions for another party.
- F4.3 FEE AVOIDANCE (-20 pts): Repeated transactions with amounts clustering just below fee thresholds (e.g. 10× Rs. 999 to avoid Rs. 1,000 fee threshold). Detect using sliding window: if more than 3 transactions in 7 days land in the range [threshold - 5%, threshold - 0.1%] to the same recipient, flag.
- F4.4 IDENTITY MISMATCH (-40 pts): Transaction origination location or device is inconsistent with declared business address more than 5 times in 30 days. Multiple concurrent sessions on different devices. Flag only — do not auto-reject.
- F4.5 DORMANCY + SUDDEN ACTIVITY (-15 pts): Account inactive for 6+ months suddenly becomes highly active. This widens the confidence interval rather than reducing the score significantly. Note it explicitly in the output.
- F4.6 CIRCULAR TRANSACTION RING (-50 pts): Money flows A → B → C → A within short cycles (under 7 days) with no apparent business rationale. This is the most severe flag. Note: distinguish from legitimate supply chains where money flows in a circle because of how a business operates.

Integrity score floor is 0. Deductions cannot push below 0.

---

### FACTOR GROUP F5 — External Utility & Compliance Signals (max 120 pts)

Source: UTILITY domain

- F5.1 NEA electricity bill AMOUNT TREND (40 pts): Is electricity consumption growing over 24 months? Calibrate against the geographic median for the customer's municipality. Growth above the 60th percentile for their area = 40 pts. Stable = 25 pts. Declining = 10 pts. This is a proxy for material wealth accumulation and business growth.
- F5.2 NEA bill PAYMENT consistency (30 pts): Same timeliness scoring as F3.1 but tracked directly from NEA records as a cross-check. If F1Soft payment records and NEA confirmation disagree, flag discrepancy.
- F5.3 Traffic violation history (20 pts): From DoTM database. Customers who consistently accrue and fail to clear traffic fines show a pattern of ignoring obligations. Max deduction: 20 pts. Not a disqualifier — a single old fine is irrelevant.
- F5.4 ISP subscription continuity (15 pts): Uninterrupted internet subscription over 12+ months indicates stable household income. Brief lapses are neutral. Permanent disconnection after 2+ years of service is a mild negative signal.
- F5.5 KUKL water bill timeliness (15 pts): Same as F3.1 but lower weight. Currently Kathmandu-centric — do not penalise customers outside KUKL coverage for absence of data.

---

### FACTOR GROUP F6 — B2B Ecosystem Feedback (max 80 pts)

Source: MERCHANT_DATA domain. Only active for merchant/business-type customers with 20+ verified B2B transactions.

- F6.1 (40 pts): Positive ratings received from verified B2B counterparties. Each positive rating is weighted by the counterparty's own Bishwas score — a high-score counterparty's positive rating counts more.
- F6.2 (25 pts): Negative ratings deduct from this sub-score. One negative in 20 = minor. Pattern of negatives = significant deduction + manual review flag.
- F6.3 (15 pts): Participation rate — merchants who consistently submit feedback (both positive and negative) demonstrate accountability.

If the customer has fewer than 20 B2B transactions, redistribute these 80 points proportionally across F1–F5 using the following weights: F1 += 20, F2 += 15, F3 += 25, F4 += 15, F5 += 5.

---

## CONFIDENCE INTERVAL

Report the score with a confidence interval based on data completeness:
- All 6 domains present, 12+ months history: ± 30 pts
- 3–5 domains present, 6–12 months history: ± 80 pts
- Fewer than 3 domains, < 6 months history: ± 150 pts (thin file)

---

## OUTPUT FORMAT

Return a JSON object with this exact structure:

{
  "customer_id": "<from input>",
  "customer_type": "INDIVIDUAL | MERCHANT | BUSINESS",
  "score": <integer 0–1000>,
  "confidence_interval": <integer>,
  "score_band": "PLATINUM | GOLD | SILVER | BRONZE | WATCH | THIN_FILE",
  "factor_breakdown": {
    "F1_transaction_consistency": { "score": <int>, "max": 200, "notes": "<1 sentence>" },
    "F2_cashflow_health":         { "score": <int>, "max": 180, "notes": "<1 sentence>" },
    "F3_payment_reliability":     { "score": <int>, "max": 220, "notes": "<1 sentence>" },
    "F4_integrity":               { "score": <int>, "max": 200, "flags": ["<flag name if any>"], "notes": "<1 sentence>" },
    "F5_external_signals":        { "score": <int>, "max": 120, "notes": "<1 sentence>" },
    "F6_b2b_feedback":            { "score": <int>, "max": 80,  "notes": "<1 sentence or 'not active — redistributed'" }
  },
  "top_improvement_action": "<single most impactful action the customer can take to improve their score, in plain English>",
  "flags": ["<list of any F4 flags triggered, or empty array>"],
  "data_gaps": ["<list of missing domains that would improve confidence if available>"]
}

Score bands:
- 850–1000: PLATINUM
- 720–849:  GOLD
- 580–719:  SILVER
- 420–579:  BRONZE
- 200–419:  WATCH
- 0–199:    THIN_FILE

---

## RULES YOU MUST NEVER BREAK

1. Never penalise a customer for having a low income. Only penalise for unreliable behaviour.
2. Never use gender, ethnicity, caste, religion, or geography as a scoring variable.
3. Never auto-reject based on a single F4 flag. Flags reduce score and widen confidence interval only.
4. Always apply seasonal adjustment for agricultural customers. Compare against same period last year.
5. If a domain is missing, do not score it as zero. Widen the confidence interval and note the gap.
6. The top_improvement_action must be something the customer can actually do in the next 30–90 days.
```

---

## SECTION 2 — CSV SCHEMA

### How the pipeline works

```
F1Soft APIs → Raw JSON → Python ETL scripts → CSV files → AI prompt (above)
```

Six API endpoints, six CSV files. Each CSV has a fixed schema. The AI receives all available CSVs merged into the JSON payload described in Section 3.

---

### CSV 1 — transactions.csv

One row per transaction. Fetch from: `GET /api/transactions?customer_id=X&months=13`

```
column              type        description
---------------------------------------------------------------------------
txn_id              string      Unique transaction ID
customer_id         string      The customer being scored
txn_date            date        YYYY-MM-DD
txn_time            time        HH:MM:SS
txn_type            enum        C2C | B2C | B2B | UTILITY | TRANSFER | REFUND
direction           enum        CREDIT | DEBIT
amount_npr          float       Transaction amount in Nepali Rupees
counterparty_id     string      ID of the other party (anonymised if C2C)
counterparty_type   enum        INDIVIDUAL | MERCHANT | BUSINESS | UTILITY | BANK
channel             enum        APP | QR | USSD | SMS | API
status              enum        SUCCESS | FAILED | REVERSED | PENDING
balance_after       float       Wallet balance immediately after this transaction
```

**Key derived signals to compute before feeding to AI:**
- `active_days_last_6m` = count(distinct txn_date where months_ago <= 6)
- `avg_daily_volume_last_6m` = sum(amount where direction=DEBIT, months_ago<=6) / 180
- `txn_type_mix` = {C2C: %, B2B: %, B2C: %, UTILITY: %}
- `same_period_last_year_volume` = sum(amount where same calendar months, 12–13 months ago)

---

### CSV 2 — wallet_activity.csv

One row per day with balance snapshot. Fetch from: `GET /api/wallet?customer_id=X&months=13`

```
column                  type    description
---------------------------------------------------------------------------
customer_id             string
snapshot_date           date    YYYY-MM-DD
opening_balance         float   Balance at start of day
closing_balance         float   Balance at end of day
peak_balance            float   Highest intraday balance
trough_balance          float   Lowest intraday balance
total_credits           float   Sum of all credits this day
total_debits            float   Sum of all debits this day
num_transactions        int     Count of transactions this day
hold_duration_hrs       float   Average hours money sat before large outflow (>Rs 5000)
large_inflow_flag       bool    True if single credit > 5× avg daily credit this month
large_outflow_24h_flag  bool    True if large inflow followed by outflow within 24 hours
```

**Key derived signals:**
- `avg_daily_balance` = mean(closing_balance over last 180 days)
- `balance_volatility` = std(closing_balance) / mean(closing_balance)
- `qoq_balance_trend` = avg(closing_balance last 90d) / avg(closing_balance 90–180d ago) - 1
- `staging_flag` = large_inflow_flag=True within 14 days of application_date AND large_outflow_24h_flag=True within 7 days after

---

### CSV 3 — merchant_data.csv

One row per B2B transaction or counterparty event. Fetch from: `GET /api/merchant?merchant_id=X&months=13`
*Only populated for MERCHANT and BUSINESS customer types.*

```
column                  type    description
---------------------------------------------------------------------------
merchant_id             string
txn_id                  string  Links to transactions.csv
counterparty_id         string
counterparty_type       enum    SUPPLIER | BUYER | PEER_MERCHANT
txn_date                date
amount_npr              float
direction               enum    CREDIT | DEBIT
payment_terms_days      int     Agreed credit terms (0 = spot payment)
actual_payment_days     int     Actual days until payment was made
overdue_flag            bool    True if actual > agreed + 3 days grace
feedback_score          int     1–5 rating given BY counterparty (null if not yet submitted)
feedback_given          int     1–5 rating given BY this merchant to counterparty
feedback_verified       bool    True if feedback is attached to a confirmed txn_id
```

**Key derived signals:**
- `b2b_txn_count` = count(rows)
- `on_time_payment_rate` = count(overdue_flag=False) / count(all) × 100
- `avg_feedback_received` = mean(feedback_score where feedback_verified=True)
- `feedback_participation_rate` = count(feedback_given is not null) / count(all)

---

### CSV 4 — users.csv

One row per customer (static profile). Fetch from: `GET /api/users?customer_id=X`

```
column                  type    description
---------------------------------------------------------------------------
customer_id             string
customer_type           enum    INDIVIDUAL | MERCHANT | BUSINESS
account_created_date    date
kyc_status              enum    FULL | BASIC | PENDING | NONE
kyc_verified_date       date
occupation              enum    AGRICULTURE | RETAIL | SERVICES | TRANSPORT | REMITTANCE | OTHER
municipality            string  Nepal municipality code (e.g. KTM-01)
province                string  Province number
account_age_months      int     Months since account creation
linked_bank_count       int     Number of linked bank accounts
nid_verified            bool    National ID verified
```

**Key signals used in scoring:**
- `occupation` → used to select the correct benchmark percentile for F2.1 and apply seasonal flag for F1.3
- `account_age_months` → if < 3 months, apply THIN_FILE status regardless of other data
- `kyc_status` → FULL KYC required for any score above BRONZE band

---

### CSV 5 — customers.csv

One row per linked bank account balance snapshot. Fetch from: `GET /api/customers?customer_id=X`

```
column                  type    description
---------------------------------------------------------------------------
customer_id             string
bank_code               string  Nepal bank code (NRB standard)
account_type            enum    SAVINGS | CURRENT | SALARY
balance_snapshot        float   Balance at time of application
snapshot_date           date
6m_avg_balance          float   Bank's own 6-month average (if available via clearing feed)
last_large_deposit_date date    Date of last deposit > Rs. 50,000
last_large_deposit_amt  float
days_since_deposit      int     Days between last_large_deposit_date and application_date
withdrawal_within_7d    bool    True if large deposit was followed by withdrawal within 7 days
```

**Key use:** Cross-bank staging detection for F4.1. If `days_since_deposit` < 14 AND `withdrawal_within_7d` = True, flag as staging.

---

### CSV 6 — utility.csv

One row per utility bill event. Fetch from: `GET /api/utility?customer_id=X&months=24`

```
column                  type    description
---------------------------------------------------------------------------
customer_id             string
utility_type            enum    NEA_ELECTRICITY | KUKL_WATER | ISP_INTERNET | TRAFFIC_FINE | MUNICIPAL_FINE
bill_issue_date         date
bill_due_date           date
bill_amount_npr         float
payment_date            date    Null if unpaid
days_to_pay             int     payment_date - bill_issue_date (null if unpaid)
overdue                 bool    True if payment_date > bill_due_date OR unpaid
fine_cleared            bool    For TRAFFIC_FINE / MUNICIPAL_FINE type only
nea_units_consumed      float   For NEA_ELECTRICITY: kWh consumed this bill cycle
nea_municipality        string  Municipality code (for geographic calibration)
```

**Key derived signals:**
- `avg_days_to_pay_nea` = mean(days_to_pay where utility_type=NEA_ELECTRICITY)
- `nea_consumption_trend` = linear slope of nea_units_consumed over last 24 months
- `nea_percentile` = customer's consumption vs. median for nea_municipality
- `traffic_fine_count_12m` = count(rows where utility_type=TRAFFIC_FINE AND bill_issue_date > 12 months ago)
- `uncleared_fines` = count(rows where fine_cleared=False)

---

## SECTION 3 — PYTHON ETL SCRIPT OUTLINE

```python
# bishwas_etl.py
# Fetch all 6 APIs, convert to CSV, compute derived signals, build AI payload

import httpx
import pandas as pd
import json
from datetime import datetime, timedelta

BASE_URL = "https://api.f1soft.com/v1"
HEADERS  = {"Authorization": "Bearer YOUR_API_KEY"}

def fetch(endpoint: str, params: dict) -> pd.DataFrame:
    r = httpx.get(f"{BASE_URL}/{endpoint}", headers=HEADERS, params=params)
    r.raise_for_status()
    return pd.DataFrame(r.json()["data"])

def build_payload(customer_id: str) -> dict:
    params = {"customer_id": customer_id, "months": 13}

    txn     = fetch("transactions",   params)
    wallet  = fetch("wallet",         params)
    users   = fetch("users",          {"customer_id": customer_id})
    cust    = fetch("customers",       {"customer_id": customer_id})
    utility = fetch("utility",        {**params, "months": 24})

    customer_type = users.iloc[0]["customer_type"]
    merchant = fetch("merchant", {"merchant_id": customer_id, "months": 13}) \
               if customer_type in ("MERCHANT", "BUSINESS") else pd.DataFrame()

    # ── Derived signals ────────────────────────────────────────────────────
    now = pd.Timestamp.now()
    six_months_ago = now - pd.DateOffset(months=6)

    txn["txn_date"] = pd.to_datetime(txn["txn_date"])
    wallet["snapshot_date"] = pd.to_datetime(wallet["snapshot_date"])
    utility["bill_issue_date"] = pd.to_datetime(utility["bill_issue_date"])

    recent_txn = txn[txn["txn_date"] >= six_months_ago]

    signals = {
        # F1
        "active_days_last_6m":          int(recent_txn["txn_date"].dt.date.nunique()),
        "txn_type_mix":                  recent_txn["txn_type"].value_counts(normalize=True).to_dict(),
        "same_period_last_year_volume":  float(txn[
            (txn["txn_date"] >= now - pd.DateOffset(months=13)) &
            (txn["txn_date"] <  now - pd.DateOffset(months=7))
        ]["amount_npr"].sum()),

        # F2
        "avg_daily_balance":             float(wallet[wallet["snapshot_date"] >= six_months_ago]["closing_balance"].mean()),
        "balance_volatility":            float(wallet["closing_balance"].std() / wallet["closing_balance"].mean()),
        "qoq_balance_trend":             float(
            wallet[wallet["snapshot_date"] >= now - pd.DateOffset(months=3)]["closing_balance"].mean() /
            wallet[(wallet["snapshot_date"] >= now - pd.DateOffset(months=6)) &
                   (wallet["snapshot_date"] <  now - pd.DateOffset(months=3))]["closing_balance"].mean() - 1
        ),

        # F3 / F5
        "avg_days_to_pay_nea":           float(
            utility[utility["utility_type"] == "NEA_ELECTRICITY"]["days_to_pay"].dropna().mean()
        ),
        "nea_consumption_trend":         float(
            pd.Series(utility[utility["utility_type"] == "NEA_ELECTRICITY"]["nea_units_consumed"]
                     .values).diff().mean()
        ),
        "traffic_fine_count_12m":        int(
            len(utility[(utility["utility_type"] == "TRAFFIC_FINE") &
                        (utility["bill_issue_date"] >= now - pd.DateOffset(months=12))])
        ),
        "uncleared_fines":               int(
            len(utility[(utility["utility_type"].isin(["TRAFFIC_FINE","MUNICIPAL_FINE"])) &
                        (utility["fine_cleared"] == False)])
        ),

        # F4
        "staging_flag":                  bool(
            len(cust[(cust["days_since_deposit"] < 14) & (cust["withdrawal_within_7d"] == True)]) > 0
        ),
    }

    if not merchant.empty:
        signals["b2b_txn_count"]             = int(len(merchant))
        signals["on_time_payment_rate"]      = float(
            (merchant["overdue_flag"] == False).mean() * 100
        )
        signals["avg_feedback_received"]     = float(
            merchant[merchant["feedback_verified"] == True]["feedback_score"].mean()
        )
        signals["feedback_participation_rate"] = float(
            merchant["feedback_given"].notna().mean() * 100
        )

    return {
        "customer_id":   customer_id,
        "customer_type": customer_type,
        "profile":       users.iloc[0].to_dict(),
        "signals":       signals,
        "raw_counts": {
            "transaction_rows": len(txn),
            "wallet_days":      len(wallet),
            "utility_rows":     len(utility),
            "merchant_rows":    len(merchant),
            "linked_banks":     len(cust),
        }
    }

def call_ai(payload: dict) -> dict:
    """Feed payload to the AI with the system prompt from Section 1."""
    import anthropic
    client = anthropic.Anthropic()

    with open("system_prompt.txt") as f:
        system = f.read()

    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system,
        messages=[{
            "role": "user",
            "content": f"Score this customer:\n\n{json.dumps(payload, indent=2)}"
        }]
    )
    return json.loads(msg.content[0].text)

if __name__ == "__main__":
    import sys
    customer_id = sys.argv[1]
    payload = build_payload(customer_id)
    result  = call_ai(payload)
    print(json.dumps(result, indent=2))
```

---

## SECTION 4 — EXAMPLE AI INPUT / OUTPUT

### Example input (abbreviated)

```json
{
  "customer_id": "USR-00472910",
  "customer_type": "MERCHANT",
  "profile": {
    "occupation": "RETAIL",
    "account_age_months": 28,
    "kyc_status": "FULL",
    "municipality": "KTM-04"
  },
  "signals": {
    "active_days_last_6m": 158,
    "txn_type_mix": { "B2C": 0.61, "B2B": 0.31, "UTILITY": 0.08 },
    "avg_daily_balance": 12400,
    "balance_volatility": 0.34,
    "qoq_balance_trend": 0.08,
    "avg_days_to_pay_nea": 6.2,
    "nea_consumption_trend": 2.1,
    "traffic_fine_count_12m": 1,
    "uncleared_fines": 0,
    "staging_flag": false,
    "b2b_txn_count": 47,
    "on_time_payment_rate": 91.5,
    "avg_feedback_received": 4.2,
    "feedback_participation_rate": 78.7
  }
}
```

### Example output

```json
{
  "customer_id": "USR-00472910",
  "customer_type": "MERCHANT",
  "score": 741,
  "confidence_interval": 30,
  "score_band": "GOLD",
  "factor_breakdown": {
    "F1_transaction_consistency": {
      "score": 178, "max": 200,
      "notes": "Active 158 of 180 days; healthy B2B/B2C mix indicating real business."
    },
    "F2_cashflow_health": {
      "score": 138, "max": 180,
      "notes": "Stable ADB of Rs. 12,400 with 8% QoQ growth; moderate volatility is normal for retail."
    },
    "F3_payment_reliability": {
      "score": 188, "max": 220,
      "notes": "NEA paid avg 6.2 days after issue; 91.5% B2B on-time rate; one traffic fine cleared promptly."
    },
    "F4_integrity": {
      "score": 200, "max": 200,
      "flags": [],
      "notes": "No integrity flags detected."
    },
    "F5_external_signals": {
      "score": 91, "max": 120,
      "notes": "NEA consumption growing steadily; one traffic fine in 12 months, cleared."
    },
    "F6_b2b_feedback": {
      "score": 64, "max": 80,
      "notes": "4.2 avg verified feedback from counterparties; 78.7% participation rate."
    }
  },
  "top_improvement_action": "Pay NEA bills within 5 days of issue (current avg: 6.2 days). Consistent early payment would add approximately 18 points to F3 within 3 months.",
  "flags": [],
  "data_gaps": []
}
```

---

## SECTION 5 — QUICK REFERENCE

| Factor | Max pts | Primary API | Key signal |
|--------|---------|-------------|------------|
| F1 Transaction consistency | 200 | transactions | active_days / total_days |
| F2 Cash flow health | 180 | wallet_activity, customers | avg_daily_balance, hold_duration |
| F3 Payment reliability | 220 | utility, merchant_data | days_to_pay, overdue_flag |
| F4 Account integrity | 200 | transactions, customers | staging, pass-through, fee-avoidance |
| F5 External signals | 120 | utility | NEA trend, fines, ISP continuity |
| F6 B2B feedback | 80 | merchant_data | avg_feedback_received |
| **TOTAL** | **1000** | | |

| Score band | Range | Action |
|------------|-------|--------|
| PLATINUM | 850–1000 | Auto-approve, highest limit |
| GOLD | 720–849 | Auto-approve, standard limit |
| SILVER | 580–719 | Approve with conditions |
| BRONZE | 420–579 | Manual review |
| WATCH | 200–419 | Decline or micro-credit only |
| THIN FILE | 0–199 | 90-day provisional onboarding |

---

*Bishwas · विश्वास · Behavioural Scoring Engine · F1Soft International · v1.0 · May 2026*
*This document is additive — new factors can be appended to Section 1 and Section 2 without modifying existing logic.*
