# Sajilo Score Database Schema Specification

This document provides a comprehensive technical overview of the simplified database schemas and data structures designed for the **Sajilo Score** fintech credit scoring platform. It details the active models, recent schema enhancements, fields, Mongoose mappings, and real mock data examples.

---

## Recent Schema Enhancements

To support higher-fidelity fraud detection, credit scoring, and Nepal-specific payment tracking, several specialized fields and enum values have been added to the database models:

1. **Transaction Enhancements**:
   * **Location Coordinates**: Added `location.latitude` and `location.longitude` alongside `location.district` to capture geographic payment contexts.
   * **Growth Rate Anomaly Tracking**: Added `transaction_growth_rate` (`Number`) to log week-over-week velocity spikes, serving as a direct input parameter for credit health and fraud modeling.
   * **Device Auditing**: Added `device_id` (`String`) to track physical terminal devices, enabling cross-referencing of merchant QR codes to prevent credential hijacking.

2. **Utility Payment Statuses**:
   * Added `MISSED` to the `payment_status` enum fields, representing situations where a merchant failed to settle a bill within the calendar month.

3. **Wallet Activity Ledger**:
   * Added `LOAN_REPAYMENT` to `activity_type` enum values to track loan settlements debited directly from the merchant's operational digital wallet.

---

## 1. Merchant Schema (`merchants`)

Stores essential business, shop, and owner metadata for Nepalese micro-merchants. Unneeded fields like `declared_monthly_income` and `average_daily_customers` have been removed to prioritize automated transaction audits.

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String | Yes | Unique identifier (e.g. `MRC-00001`) |
| `merchant_code` | String | Yes | Unique public-facing code |
| `merchant_name` | String | Yes | Name of the shop or enterprise |
| `owner_name` | String | Yes | Full name of the business owner |
| `phone_number` | String | Yes | Owner's mobile number (unique index) |
| `business_type` | String | Yes | Business category. Enums: `TEA_SHOP`, `GROCERY`, `RESTAURANT`, `VEGETABLE_SHOP`, `PHARMACY`, `MOBILE_REPAIR`, `STATIONERY`, `CLOTHING_STORE`, `BEAUTY_PARLOUR`, `MEAT_SHOP`, `BAKERY`, `DAIRY_SHOP`, `CYBER_CAFE`, `HARDWARE_STORE`, `SNACK_SHOP`, `OTHER` |
| `registration_status`| String | Yes | Shop legal status. Enums: `registered`, `unregistered`, `in_process` |
| `location` | Object | Yes | Location sub-document |
| `location.province` | String | No | Province name (defaults to `Bagmati`) |
| `location.district` | String | Yes | District name (e.g., `Bhaktapur`) |
| `location.municipality`| String | Yes | Local municipality (e.g., `Madhyapur Thimi`) |
| `location.ward_no` | Number | Yes | Local ward number |
| `wallet_age_months` | Number | Yes | How many months the merchant has used QR/digital services |
| `business_started_year`| Number | No | The calendar year the business was established |
| `is_active` | Boolean | Yes | Operational flag (defaults to `true`) |
| `created_at` | Date | Yes | Auto-generated timestamp |
| `updated_at` | Date | Yes | Auto-generated timestamp |

### JSON Mock Data Example (`merchants.json`)

```json
[
  {
    "_id": "MRC-00001",
    "merchant_code": "MRC-00001",
    "merchant_name": "Maya Tea Stall",
    "owner_name": "Maya Shrestha",
    "phone_number": "9800000001",
    "business_type": "TEA_SHOP",
    "registration_status": "unregistered",
    "location": {
      "province": "Bagmati",
      "district": "Bhaktapur",
      "municipality": "Madhyapur Thimi",
      "ward_no": 4
    },
    "wallet_age_months": 18,
    "business_started_year": 2021,
    "is_active": true,
    "created_at": {
      "$date": "2026-05-30T00:00:00Z"
    },
    "updated_at": {
      "$date": "2026-05-30T00:00:00Z"
    }
  }
]
```

---

## 2. Customer Schema (`customers`)

Stores consumer profile details, including physical locations, wallet balances, and identity verification states.

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String | Yes | Unique identifier (e.g. `CUS-00001`) |
| `customer_code` | String | Yes | Unique customer public code |
| `customer_name` | String | Yes | Full name of the customer |
| `phone_number` | String | No | Mobile number |
| `location` | Object | Yes | Location sub-document |
| `location.province` | String | No | Province name (defaults to `Bagmati`) |
| `location.district` | String | Yes | Home district name (e.g., `Kathmandu`) |
| `location.municipality`| String | Yes | Local municipality (e.g., `Kathmandu Metropolitan City`) |
| `location.ward_no` | Number | Yes | Local ward number |
| `verified_status` | String | Yes | KYC status. Enums: `verified`, `unverified` |
| `balance` | Number | Yes | Active digital wallet balance (defaults to `0`) |
| `created_at` | Date | Yes | Timestamp of account registration |

### JSON Mock Data Example (`customers.json`)

```json
[
  {
    "_id": "CUS-00001",
    "customer_code": "CUS-00001",
    "customer_name": "Anil Sharma",
    "phone_number": "9810000001",
    "location": {
      "province": "Bagmati",
      "district": "Kathmandu",
      "municipality": "Kathmandu Metropolitan City",
      "ward_no": 10
    },
    "created_at": {
      "$date": "2026-05-30T00:00:00Z"
    },
    "verified_status": "verified",
    "balance": 12000
  }
]
```

---

## 3. Transaction Schema (`transactions`)

Tracks all digital financial exchanges, enabling both business-to-customer (B2C) and business-to-business (B2B) payments with audit parameters.

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String | Yes | Unique transaction identifier |
| `transaction_code` | String | Yes | Human-readable unique code |
| `sender_code` | String | Yes | Identifier of the sender (Business or Customer) |
| `sender_name` | String | Yes | Name of the sender |
| `receiver_code` | String | Yes | Identifier of the receiver (Business or Customer) |
| `receiver_name` | String | Yes | Name of the receiver |
| `amount` | Number | Yes | Transaction value |
| `transaction_type` | String | Yes | Type of payment. Enums: `QR_PAYMENT`, `WALLET_PAYMENT`, `REFUND`, `CASH_IN`, `CASH_OUT`, `SUPPLIER_PAYMENT`, `BILL_PAYMENT` |
| `status` | String | Yes | Transaction status. Enums: `SUCCESS`, `FAILED`, `REFUNDED`, `PENDING` |
| `payment_channel` | String | No | Payment method. Enums: `QR`, `WALLET`, `BANK_TRANSFER`, `CASH` |
| `transaction_growth_rate`| Number | No | Week-over-week velocity anomaly tracker (defaults to `0`) |
| `device_id` | String | No | Terminal hardware ID |
| `location` | Object | No | Geographic location sub-document |
| `location.district` | String | No | Transaction district name |
| `location.latitude` | Number | No | Precise coordinate latitude |
| `location.longitude` | Number | No | Precise coordinate longitude |
| `transaction_time` | Date | Yes | Time transaction was executed |
| `remarks` | String | No | Descriptive remarks |
| `created_at` | Date | Yes | Database logging timestamp |

### JSON Mock Data Example (`transactions.json`)

```json
[
  {
    "_id": "TXN-00000001",
    "transaction_code": "TXN-00000001",
    "sender_code": "CUS-00001",
    "sender_name": "Anil Sharma",
    "receiver_code": "MRC-00001",
    "receiver_name": "Maya Tea Stall",
    "amount": 450,
    "transaction_type": "QR_PAYMENT",
    "status": "SUCCESS",
    "payment_channel": "QR",
    "transaction_growth_rate": 0.08,
    "device_id": "DEV-MRC-00001",
    "location": {
      "district": "Bhaktapur",
      "latitude": 27.6801,
      "longitude": 85.3862
    },
    "transaction_time": {
      "$date": "2026-05-25T09:30:00Z"
    },
    "remarks": "Tea shop QR payment",
    "created_at": {
      "$date": "2026-05-25T09:30:00Z"
    }
  }
]
```

---

## 4. Utility Payment Schema (`utilitypayments`)

Tracks bill payments to external service providers, giving critical behavioral insights regarding how reliably a business manages operational overhead.

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String | Yes | Unique billing identifier |
| `merchant_id` | String | Yes | Ref of the paying Merchant |
| `sender_id` | String | Yes | ID of the individual submitting the payment |
| `sender_name` | String | Yes | Name of the individual submitting the payment |
| `bill_type` | String | Yes | Category of utility bill. Enums: `ELECTRICITY`, `WATER`, `INTERNET`, `MOBILE_TOPUP` |
| `bill_amount` | Number | Yes | Total bill amount |
| `due_date` | Date | Yes | Billing deadline |
| `paid_date` | Date | No | Timestamp of transaction settlement |
| `payment_status` | String | Yes | Timeliness status. Enums: `ON_TIME`, `LATE`, `MISSED`, `UNPAID`, `PAID_EARLY` |
| `days_late` | Number | Yes | Total days overdue (defaults to `0`) |
| `created_at` | Date | Yes | Record logging timestamp |

### JSON Mock Data Example (`utilitypayments.json`)

```json
[
  {
    "_id": "UTIL-00001",
    "merchant_id": "MRC-00001",
    "sender_id": "MRC-00001",
    "sender_name": "Maya Tea Stall",
    "bill_type": "ELECTRICITY",
    "bill_amount": 1800,
    "due_date": {
      "$date": "2026-04-15T00:00:00Z"
    },
    "paid_date": {
      "$date": "2026-04-14T00:00:00Z"
    },
    "payment_status": "ON_TIME",
    "days_late": 0,
    "created_at": {
      "$date": "2026-05-30T00:00:00Z"
    }
  }
]
```

---

## 5. Wallet Activity Schema (`walletactivities`)

Logs all internal wallet changes. This ledger tracks the running balance after each debit or credit operation.

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String | Yes | Unique activity identifier |
| `merchant_id` | String | Yes | Ref of the Merchant |
| `activity_type` | String | Yes | Transaction categorization. Enums: `PAYMENT_RECEIVED`, `CASH_IN`, `CASH_OUT`, `SUPPLIER_PAYMENT`, `BILL_PAYMENT`, `LOAN_REPAYMENT` |
| `amount` | Number | Yes | Amount loaded/debited |
| `balance_after_transaction`| Number | Yes | Final wallet balance immediately following transaction |
| `activity_time` | Date | Yes | Execution timestamp |
| `created_at` | Date | Yes | Database logging timestamp |

### JSON Mock Data Example (`walletactivities.json`)

```json
[
  {
    "_id": "WAL-00001",
    "merchant_id": "MRC-00001",
    "activity_type": "PAYMENT_RECEIVED",
    "amount": 5000,
    "balance_after_transaction": 12000,
    "activity_time": {
      "$date": "2026-05-24T11:00:00Z"
    },
    "created_at": {
      "$date": "2026-05-24T11:00:00Z"
    }
  }
]
```
