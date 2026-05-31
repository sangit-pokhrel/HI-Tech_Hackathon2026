# Nagarik Credits ML Service

This ML service matches the updated backend schema where:
- `User` is centralized.
- `Merchant.user_id` points to `User`.
- `Transaction.sender_id` and `Transaction.receiver_id` point to `User`.
- `WalletActivity.user_id` points to `User`.
- `UtilityPayment`, `LoanApplication`, `RepaymentRecord`, `SocialEdge`, `PsychometricAnswer`, `MerchantFeature`, `ModelPrediction`, `CreditScore`, and `MLTrainingRun` are supported.

## Setup

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Configure backend URL

Edit `.env`:

```env
BACKEND_API_BASE_URL=http://localhost:3000/api
```

## Run order

```bash
python -m src.ingestion.fetch_api_to_csv
python -m src.ingestion.validate_raw_data
python -m src.features.build_features
python -m src.training.train_credit_risk_model
uvicorn api.main:app --reload --port 9000
```

## Test

Open:

```text
http://127.0.0.1:9000/docs
```

Prediction:

```text
GET /predict/{merchant_id}
```

Example:

```text
GET /predict/MRC-00001
```

## Important

If `repayment_records` has real labels, the model trains properly.

If `repayment_records` is empty, the service can generate synthetic labels using `GENERATE_SYNTHETIC_LABELS=true`. This is good for a hackathon demo, but real production ML needs actual repayment outcomes.
