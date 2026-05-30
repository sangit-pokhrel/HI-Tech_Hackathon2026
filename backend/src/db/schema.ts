import mongoose, { Schema, model, Document } from "mongoose";

// ==========================================
// 1. MERCHANT SCHEMA & INTERFACE
// ==========================================
export interface IMerchant {
  _id: string;
  merchant_code: string;
  merchant_name: string;
  owner_name: string;
  phone_number: string;
  business_type: string;
  registration_status: string;
  location: {
    province?: string;
    district: string;
    municipality: string;
    ward_no: number;
  };
  wallet_age_months: number;
  declared_monthly_income: number;
  business_started_year?: number;
  average_daily_customers?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    _id: { type: String, required: true },
    merchant_code: { type: String, required: true, unique: true },
    merchant_name: { type: String, required: true },
    owner_name: { type: String, required: true },
    phone_number: { type: String, required: true, unique: true },
    business_type: {
      type: String,
      required: true,
      enum: [
        "TEA_SHOP",
        "GROCERY",
        "RESTAURANT",
        "VEGETABLE_SHOP",
        "PHARMACY",
        "MOBILE_REPAIR",
        "STATIONERY",
        "CLOTHING_STORE",
        "BEAUTY_PARLOUR",
        "MEAT_SHOP",
        "BAKERY",
        "DAIRY_SHOP",
        "CYBER_CAFE",
        "HARDWARE_STORE",
        "SNACK_SHOP",
        "OTHER",
      ],
    },
    registration_status: {
      type: String,
      required: true,
      enum: ["registered", "unregistered", "in_process"],
      default: "unregistered",
    },
    location: {
      province: { type: String, default: "Bagmati" },
      district: { type: String, required: true },
      municipality: { type: String, required: true },
      ward_no: { type: Number, required: true, min: 1 },
    },
    wallet_age_months: { type: Number, required: true, min: 0 },
    declared_monthly_income: { type: Number, required: true, min: 0 },
    business_started_year: { type: Number },
    average_daily_customers: { type: Number },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false, // Custom String IDs
  }
);

// Indexes
merchantSchema.index({ merchant_code: 1 }, { unique: true });
merchantSchema.index({ phone_number: 1 }, { unique: true });
merchantSchema.index({ business_type: 1 });
merchantSchema.index({ "location.district": 1 });

export const Merchant = mongoose.models.Merchant || model<IMerchant>("Merchant", merchantSchema);

// ==========================================
// 2. CUSTOMER SCHEMA & INTERFACE
// ==========================================
export interface ICustomer {
  _id: string;
  customer_code: string;
  customer_name: string;
  phone_number?: string;
  district?: string;
  created_at: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    _id: { type: String, required: true },
    customer_code: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
    phone_number: { type: String },
    district: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

customerSchema.index({ customer_code: 1 }, { unique: true });
customerSchema.index({ phone_number: 1 });

export const Customer = mongoose.models.Customer || model<ICustomer>("Customer", customerSchema);

// ==========================================
// 3. TRANSACTION SCHEMA & INTERFACE
// ==========================================
export interface ITransaction {
  _id: string;
  transaction_code: string;
  merchant_id: string; // Ref to Merchant
  customer_id?: string; // Ref to Customer
  amount: number;
  transaction_type: string;
  status: string;
  payment_channel?: string;
  transaction_time: Date;
  remarks?: string;
  created_at: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    _id: { type: String, required: true },
    transaction_code: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    customer_id: { type: String, ref: "Customer" },
    amount: { type: Number, required: true, min: 0 },
    transaction_type: {
      type: String,
      required: true,
      enum: [
        "QR_PAYMENT",
        "WALLET_PAYMENT",
        "REFUND",
        "CASH_IN",
        "CASH_OUT",
        "SUPPLIER_PAYMENT",
        "BILL_PAYMENT",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILED", "REFUNDED", "PENDING"],
      default: "SUCCESS",
    },
    payment_channel: {
      type: String,
      enum: ["QR", "WALLET", "BANK_TRANSFER", "CASH"],
      default: "QR",
    },
    transaction_time: { type: Date, default: Date.now },
    remarks: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

transactionSchema.index({ merchant_id: 1 });
transactionSchema.index({ customer_id: 1 });
transactionSchema.index({ transaction_time: -1 });
transactionSchema.index({ merchant_id: 1, transaction_time: -1 });
transactionSchema.index({ merchant_id: 1, status: 1 });

export const Transaction = mongoose.models.Transaction || model<ITransaction>("Transaction", transactionSchema);

// ==========================================
// 4. UTILITY PAYMENT SCHEMA & INTERFACE
// ==========================================
export interface IUtilityPayment {
  _id: string;
  merchant_id: string; // Ref to Merchant
  bill_type: string;
  bill_amount: number;
  due_date: Date;
  paid_date?: Date;
  payment_status: string;
  days_late: number;
  created_at: Date;
}

const utilityPaymentSchema = new Schema<IUtilityPayment>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    bill_type: {
      type: String,
      required: true,
      enum: ["ELECTRICITY", "WATER", "INTERNET", "MOBILE_TOPUP"],
    },
    bill_amount: { type: Number, required: true, min: 0 },
    due_date: { type: Date, required: true },
    paid_date: { type: Date },
    payment_status: {
      type: String,
      required: true,
      enum: ["ON_TIME", "LATE", "UNPAID", "PAID_EARLY"],
      default: "UNPAID",
    },
    days_late: { type: Number, default: 0, min: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

utilityPaymentSchema.index({ merchant_id: 1 });
utilityPaymentSchema.index({ merchant_id: 1, due_date: -1 });

export const UtilityPayment = mongoose.models.UtilityPayment || model<IUtilityPayment>("UtilityPayment", utilityPaymentSchema);

// ==========================================
// 5. WALLET ACTIVITY SCHEMA & INTERFACE
// ==========================================
export interface IWalletActivity {
  _id: string;
  merchant_id: string; // Ref to Merchant
  activity_type: string;
  amount: number;
  balance_after_transaction: number;
  activity_time: Date;
  created_at: Date;
}

const walletActivitySchema = new Schema<IWalletActivity>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    activity_type: {
      type: String,
      required: true,
      enum: [
        "PAYMENT_RECEIVED",
        "CASH_IN",
        "CASH_OUT",
        "SUPPLIER_PAYMENT",
        "BILL_PAYMENT",
      ],
    },
    amount: { type: Number, required: true, min: 0 },
    balance_after_transaction: { type: Number, required: true },
    activity_time: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

walletActivitySchema.index({ merchant_id: 1 });
walletActivitySchema.index({ merchant_id: 1, activity_time: -1 });

export const WalletActivity = mongoose.models.WalletActivity || model<IWalletActivity>("WalletActivity", walletActivitySchema);

// ==========================================
// 6. LOAN APPLICATION SCHEMA & INTERFACE
// ==========================================
export interface ILoanApplication {
  _id: string;
  merchant_id: string; // Ref to Merchant
  requested_amount: number;
  loan_purpose: string;
  preferred_repayment_type: string;
  application_status: string;
  approved_amount?: number;
  approved_interest_rate?: number;
  approved_tenure_days?: number;
  applied_at: Date;
  decided_at?: Date;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    requested_amount: { type: Number, required: true, min: 0 },
    loan_purpose: { type: String, required: true },
    preferred_repayment_type: {
      type: String,
      required: true,
      enum: ["DAILY", "WEEKLY", "MONTHLY"],
    },
    application_status: {
      type: String,
      required: true,
      enum: ["PENDING", "APPROVED", "REJECTED", "DISBURSED", "CLOSED", "DEFAULTED"],
      default: "PENDING",
    },
    approved_amount: { type: Number },
    approved_interest_rate: { type: Number },
    approved_tenure_days: { type: Number },
    applied_at: { type: Date, default: Date.now },
    decided_at: { type: Date },
  },
  { _id: false }
);

loanApplicationSchema.index({ merchant_id: 1 });
loanApplicationSchema.index({ application_status: 1 });
loanApplicationSchema.index({ applied_at: -1 });

export const LoanApplication = mongoose.models.LoanApplication || model<ILoanApplication>("LoanApplication", loanApplicationSchema);

// ==========================================
// 7. REPAYMENT RECORD SCHEMA & INTERFACE
// ==========================================
export interface IRepaymentRecord {
  _id: string;
  loan_application_id: string; // Ref to LoanApplication
  merchant_id: string; // Ref to Merchant
  installment_no: number;
  due_amount: number;
  paid_amount: number;
  due_date: Date;
  paid_date?: Date;
  repayment_status: string;
  days_late: number;
}

const repaymentRecordSchema = new Schema<IRepaymentRecord>(
  {
    _id: { type: String, required: true },
    loan_application_id: { type: String, ref: "LoanApplication", required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    installment_no: { type: Number, required: true, min: 1 },
    due_amount: { type: Number, required: true, min: 0 },
    paid_amount: { type: Number, required: true, min: 0 },
    due_date: { type: Date, required: true },
    paid_date: { type: Date },
    repayment_status: {
      type: String,
      required: true,
      enum: ["PAID_ON_TIME", "PAID_LATE", "PARTIALLY_PAID", "MISSED", "PENDING"],
      default: "PENDING",
    },
    days_late: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

repaymentRecordSchema.index({ merchant_id: 1 });
repaymentRecordSchema.index({ loan_application_id: 1 });
repaymentRecordSchema.index({ repayment_status: 1 });

export const RepaymentRecord = mongoose.models.RepaymentRecord || model<IRepaymentRecord>("RepaymentRecord", repaymentRecordSchema);

// ==========================================
// 8. SOCIAL EDGE SCHEMA & INTERFACE
// ==========================================
export interface ISocialEdge {
  _id: string;
  source_merchant_id: string; // Ref to Merchant
  target_entity_type: string;
  target_entity_id: string; // Custom string reference (e.g. CUS001)
  relationship_type: string;
  trust_strength: number;
  interaction_count: number;
  last_interaction_at?: Date;
  created_at: Date;
}

const socialEdgeSchema = new Schema<ISocialEdge>(
  {
    _id: { type: String, required: true },
    source_merchant_id: { type: String, ref: "Merchant", required: true },
    target_entity_type: {
      type: String,
      required: true,
      enum: ["CUSTOMER", "MERCHANT", "SUPPLIER", "GUARANTOR"],
    },
    target_entity_id: { type: String, required: true },
    relationship_type: {
      type: String,
      required: true,
      enum: ["REGULAR_CUSTOMER", "SUPPLIER", "GUARANTOR", "BUSINESS_REFERENCE"],
    },
    trust_strength: { type: Number, required: true, min: 1, max: 10 },
    interaction_count: { type: Number, default: 0, min: 0 },
    last_interaction_at: { type: Date },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

socialEdgeSchema.index({ source_merchant_id: 1 });
socialEdgeSchema.index({ target_entity_id: 1 });
socialEdgeSchema.index({ relationship_type: 1 });

export const SocialEdge = mongoose.models.SocialEdge || model<ISocialEdge>("SocialEdge", socialEdgeSchema);

// ==========================================
// 9. PSYCHOMETRIC QUESTION SCHEMA & INTERFACE
// ==========================================
export interface IPsychometricQuestion {
  _id: string;
  question_code: string;
  question_text: string;
  trait_measured: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  option_scores: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  best_option: string;
  is_active: boolean;
  created_at: Date;
}

const psychometricQuestionSchema = new Schema<IPsychometricQuestion>(
  {
    _id: { type: String, required: true },
    question_code: { type: String, required: true, unique: true },
    question_text: { type: String, required: true },
    trait_measured: {
      type: String,
      required: true,
      enum: [
        "REPAYMENT_ATTITUDE",
        "RISK_DISCIPLINE",
        "HONESTY",
        "PLANNING_BEHAVIOUR",
        "BUSINESS_RESPONSIBILITY",
        "CASH_FLOW_DISCIPLINE",
        "RECORD_KEEPING",
      ],
    },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    option_scores: {
      A: { type: Number, required: true },
      B: { type: Number, required: true },
      C: { type: Number, required: true },
      D: { type: Number, required: true },
    },
    best_option: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const PsychometricQuestion =
  mongoose.models.PsychometricQuestion ||
  model<IPsychometricQuestion>("PsychometricQuestion", psychometricQuestionSchema);

// ==========================================
// 10. PSYCHOMETRIC ANSWER SCHEMA & INTERFACE
// ==========================================
export interface IPsychometricAnswer {
  _id: string;
  merchant_id: string; // Ref to Merchant
  question_id: string; // Ref to PsychometricQuestion
  selected_option: string;
  response_time_ms?: number;
  answer_score: number;
  answered_at: Date;
}

const psychometricAnswerSchema = new Schema<IPsychometricAnswer>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    question_id: { type: String, ref: "PsychometricQuestion", required: true },
    selected_option: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    response_time_ms: { type: Number, min: 0 },
    answer_score: { type: Number, required: true, min: 0 },
    answered_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

psychometricAnswerSchema.index({ merchant_id: 1 });
psychometricAnswerSchema.index({ question_id: 1 });

export const PsychometricAnswer =
  mongoose.models.PsychometricAnswer || model<IPsychometricAnswer>("PsychometricAnswer", psychometricAnswerSchema);

// ==========================================
// 11. MERCHANT FEATURE SCHEMA & INTERFACE
// ==========================================
export interface IMerchantFeature {
  _id: string;
  merchant_id: string; // Ref to Merchant
  feature_window: {
    start_date: Date;
    end_date: Date;
    window_days: number;
  };
  features: {
    monthly_revenue_avg: number;
    total_transaction_count: number;
    avg_transaction_amount: number;
    active_days_ratio: number;
    repeat_customer_ratio: number;
    customer_diversity_score: number;
    refund_rate: number;
    failed_payment_rate: number;
    utility_payment_delay_avg: number;
    on_time_utility_payment_ratio: number;
    cashout_speed_score: number;
    balance_stability_score: number;
    loan_to_income_ratio: number;
    past_repayment_delay_avg: number;
    repayment_success_ratio: number;
    social_trust_score: number;
    regular_customer_count: number;
    guarantor_count: number;
    psychometric_avg_score: number;
    psychometric_consistency_score: number;
    suspicious_spike_score: number;
    seasonal_pattern_score: number;
  };
  feature_version: string;
  updated_at: Date;
}

const merchantFeatureSchema = new Schema<IMerchantFeature>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true, unique: true },
    feature_window: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
      window_days: { type: Number, required: true, default: 30 },
    },
    features: {
      monthly_revenue_avg: { type: Number, required: true, default: 0 },
      total_transaction_count: { type: Number, required: true, default: 0 },
      avg_transaction_amount: { type: Number, required: true, default: 0 },
      active_days_ratio: { type: Number, required: true, default: 0 },
      repeat_customer_ratio: { type: Number, required: true, default: 0 },
      customer_diversity_score: { type: Number, required: true, default: 0 },
      refund_rate: { type: Number, required: true, default: 0 },
      failed_payment_rate: { type: Number, required: true, default: 0 },
      utility_payment_delay_avg: { type: Number, required: true, default: 0 },
      on_time_utility_payment_ratio: { type: Number, required: true, default: 0 },
      cashout_speed_score: { type: Number, required: true, default: 0 },
      balance_stability_score: { type: Number, required: true, default: 0 },
      loan_to_income_ratio: { type: Number, required: true, default: 0 },
      past_repayment_delay_avg: { type: Number, required: true, default: 0 },
      repayment_success_ratio: { type: Number, required: true, default: 0 },
      social_trust_score: { type: Number, required: true, default: 0 },
      regular_customer_count: { type: Number, required: true, default: 0 },
      guarantor_count: { type: Number, required: true, default: 0 },
      psychometric_avg_score: { type: Number, required: true, default: 0 },
      psychometric_consistency_score: { type: Number, required: true, default: 0 },
      suspicious_spike_score: { type: Number, required: true, default: 0 },
      seasonal_pattern_score: { type: Number, required: true, default: 0 },
    },
    feature_version: { type: String, required: true, default: "v1.0" },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

merchantFeatureSchema.index({ merchant_id: 1 }, { unique: true });
merchantFeatureSchema.index({ updated_at: -1 });

export const MerchantFeature =
  mongoose.models.MerchantFeature || model<IMerchantFeature>("MerchantFeature", merchantFeatureSchema);

// ==========================================
// 12. CREDIT SCORE SCHEMA & INTERFACE
// ==========================================
export interface ICreditScore {
  _id: string;
  merchant_id: string; // Ref to Merchant
  feature_id: string; // Ref to MerchantFeature
  loan_application_id?: string; // Ref to LoanApplication
  scores: {
    financial_score: number;
    behavioural_score: number;
    social_score: number;
    psychometric_score: number;
    fraud_penalty: number;
    final_sajilo_score: number;
  };
  risk_band: string;
  decision: string;
  suggested_loan_amount?: number;
  repayment_plan?: string;
  fraud_flags: string[];
  explanation?: string;
  model_version: string;
  calculated_at: Date;
}

const creditScoreSchema = new Schema<ICreditScore>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    feature_id: { type: String, ref: "MerchantFeature", required: true },
    loan_application_id: { type: String, ref: "LoanApplication" },
    scores: {
      financial_score: { type: Number, required: true },
      behavioural_score: { type: Number, required: true },
      social_score: { type: Number, required: true },
      psychometric_score: { type: Number, required: true },
      fraud_penalty: { type: Number, required: true, default: 0 },
      final_sajilo_score: { type: Number, required: true },
    },
    risk_band: {
      type: String,
      required: true,
      enum: ["PLATINUM", "GOLD", "SILVER", "BRONZE", "HIGH_RISK"],
    },
    decision: {
      type: String,
      required: true,
      enum: ["APPROVED", "MANUAL_REVIEW", "REJECTED"],
    },
    suggested_loan_amount: { type: Number },
    repayment_plan: { type: String },
    fraud_flags: [{ type: String }],
    explanation: { type: String },
    model_version: { type: String, required: true },
    calculated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

creditScoreSchema.index({ merchant_id: 1 });
creditScoreSchema.index({ loan_application_id: 1 });
creditScoreSchema.index({ risk_band: 1 });
creditScoreSchema.index({ decision: 1 });

export const CreditScore = mongoose.models.CreditScore || model<ICreditScore>("CreditScore", creditScoreSchema);

// ==========================================
// 13. ML TRAINING RUN SCHEMA & INTERFACE
// ==========================================
export interface IMLTrainingRun {
  _id: string;
  model_name: string;
  model_version: string;
  algorithm: string;
  training_data_from?: Date;
  training_data_to?: Date;
  total_records: number;
  training_records: number;
  testing_records: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_score: number;
  };
  feature_columns: string[];
  trained_at: Date;
  trained_by: string;
}

const mlTrainingRunSchema = new Schema<IMLTrainingRun>(
  {
    _id: { type: String, required: true },
    model_name: { type: String, required: true, default: "merchant-credit-model" },
    model_version: { type: String, required: true },
    algorithm: { type: String, required: true },
    training_data_from: { type: Date },
    training_data_to: { type: Date },
    total_records: { type: Number, required: true },
    training_records: { type: Number, required: true },
    testing_records: { type: Number, required: true },
    metrics: {
      accuracy: { type: Number, required: true },
      precision: { type: Number, required: true },
      recall: { type: Number, required: true },
      f1_score: { type: Number, required: true },
      auc_score: { type: Number, required: true },
    },
    feature_columns: [{ type: String }],
    trained_at: { type: Date, default: Date.now },
    trained_by: { type: String, default: "system" },
  },
  { _id: false }
);

mlTrainingRunSchema.index({ model_version: 1 });

export const MLTrainingRun =
  mongoose.models.MLTrainingRun || model<IMLTrainingRun>("MLTrainingRun", mlTrainingRunSchema);

// ==========================================
// 14. MODEL PREDICTION SCHEMA & INTERFACE
// ==========================================
export interface IModelPrediction {
  _id: string;
  merchant_id: string; // Ref to Merchant
  loan_application_id?: string; // Ref to LoanApplication
  feature_id: string; // Ref to MerchantFeature
  model_name: string;
  model_version: string;
  prediction_input: Schema.Types.Map;
  prediction_output: {
    default_probability: number;
    predicted_class: string;
    recommended_score: number;
    recommended_amount?: number;
  };
  explanation: {
    positive_factors: string[];
    negative_factors: string[];
  };
  predicted_at: Date;
}

const modelPredictionSchema = new Schema<IModelPrediction>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true },
    loan_application_id: { type: String, ref: "LoanApplication" },
    feature_id: { type: String, ref: "MerchantFeature", required: true },
    model_name: { type: String, required: true, default: "merchant-credit-model" },
    model_version: { type: String, required: true },
    prediction_input: { type: Map, of: Schema.Types.Mixed },
    prediction_output: {
      default_probability: { type: Number, required: true },
      predicted_class: { type: String, required: true },
      recommended_score: { type: Number, required: true },
      recommended_amount: { type: Number },
    },
    explanation: {
      positive_factors: [{ type: String }],
      negative_factors: [{ type: String }],
    },
    predicted_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

modelPredictionSchema.index({ merchant_id: 1 });
modelPredictionSchema.index({ loan_application_id: 1 });

export const ModelPrediction =
  mongoose.models.ModelPrediction || model<IModelPrediction>("ModelPrediction", modelPredictionSchema);

// ==========================================
// BACKWARDS COMPATIBILITY USER MODEL
// ==========================================
export interface IUser {
  name: string;
  email: string;
  age?: number;
  bio?: string;
}
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number },
    bio: { type: String },
  },
  { timestamps: true }
);
export const User = mongoose.models.User || model<IUser>("User", userSchema);

