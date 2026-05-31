import mongoose, { Schema, model } from "mongoose";

// ==========================================
// 1. CENTRALIZED USER SCHEMA & INTERFACE
// ==========================================
export interface IUser {
  _id: string; // Custom ID like USR-00001
  user_code: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  user_type: string; // MERCHANT, CUSTOMER, BOTH
  location: {
    province?: string;
    district: string;
    municipality: string;
    ward_no: number;
  };
  verified_status: string; // verified, unverified
  balance: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    user_code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    user_type: {
      type: String,
      required: true,
      enum: ["MERCHANT", "CUSTOMER", "BOTH", "ADMIN"],
      default: "CUSTOMER",
    },
    location: {
      province: { type: String, default: "Bagmati" },
      district: { type: String, required: true },
      municipality: { type: String, required: true },
      ward_no: { type: Number, required: true, min: 1 },
    },
    verified_status: {
      type: String,
      required: true,
      enum: ["verified", "unverified"],
      default: "unverified",
    },
    balance: { type: Number, required: true, default: 0, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

// Pre-save hook to hash the password before saving
userSchema.pre("save", function (next) {
  const user = this as any;
  if (!user.isModified("password") || !user.password) return next();

  try {
    // Hash password using Bun's native high-performance password hashing
    user.password = Bun.password.hashSync(user.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
    next();
  } catch (err: any) {
    next(err);
  }
});

export const User = mongoose.models.User || model<IUser>("User", userSchema);

// ==========================================
// 2. MERCHANT PROFILE SCHEMA & INTERFACE
// ==========================================
export interface IMerchant {
  _id: string; // Custom ID like MRC-00001
  user_id: string; // Ref to centralized User
  merchant_code: string;
  merchant_name: string;
  business_type: string;
  registration_status: string;
  wallet_age_months: number;
  business_started_year?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, ref: "User", required: true, unique: true },
    merchant_code: { type: String, required: true, unique: true },
    merchant_name: { type: String, required: true },
    business_type: {
      type: String,
      required: true,
      enum: [
        "TEA_SHOP", "GROCERY", "RESTAURANT", "VEGETABLE_SHOP", "AGRICULTURE", "FRUIT_SHOP", "PHARMACY",
        "MOBILE_REPAIR", "STATIONERY", "CLOTHING_STORE", "BEAUTY_PARLOUR",
        "MEAT_SHOP", "BAKERY", "DAIRY_SHOP", "CYBER_CAFE", "HARDWARE_STORE",
        "SNACK_SHOP", "OTHER",
      ],
    },
    registration_status: {
      type: String,
      required: true,
      enum: ["registered", "unregistered", "in_process"],
      default: "unregistered",
    },
    wallet_age_months: { type: Number, required: true, min: 0 },
    business_started_year: { type: Number },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

export const Merchant = mongoose.models.Merchant || model<IMerchant>("Merchant", merchantSchema);

// ==========================================
// 3. CUSTOMER PROFILE SCHEMA & INTERFACE
// ==========================================
export interface ICustomer {
  _id: string; // Custom ID like CUS-00001
  user_id: string; // Ref to centralized User
  customer_code: string;
  customer_name: string;
  created_at: Date;
  updated_at: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, ref: "User", required: true, unique: true },
    customer_code: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

export const Customer = mongoose.models.Customer || model<ICustomer>("Customer", customerSchema);

// ==========================================
// 4. TRANSACTION SCHEMA & INTERFACE
// ==========================================
export interface ITransaction {
  _id: string;
  transaction_code: string;
  sender_id: string; // Ref to User (centralized sender)
  receiver_id: string; // Ref to User (centralized receiver)
  amount: number;
  transaction_type: string;
  status: string;
  payment_channel?: string;
  transaction_growth_rate?: number;
  device_id?: string;
  location?: {
    district?: string;
    latitude?: number;
    longitude?: number;
  };
  transaction_time: Date;
  remarks?: string;
  created_at: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    _id: { type: String, required: true },
    transaction_code: { type: String, required: true },
    sender_id: { type: String, ref: "User", required: true },
    receiver_id: { type: String, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    transaction_type: {
      type: String,
      required: true,
      enum: [
        "QR_PAYMENT", "WALLET_PAYMENT", "REFUND", "CASH_IN", "CASH_OUT",
        "SUPPLIER_PAYMENT", "BILL_PAYMENT",
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
    transaction_growth_rate: { type: Number, default: 0 },
    device_id: { type: String },
    location: {
      district: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    transaction_time: { type: Date, default: Date.now },
    remarks: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

transactionSchema.index({ transaction_code: 1 });
transactionSchema.index({ sender_id: 1 });
transactionSchema.index({ receiver_id: 1 });
transactionSchema.index({ transaction_time: -1 });

export const Transaction = mongoose.models.Transaction || model<ITransaction>("Transaction", transactionSchema);

// ==========================================
// 5. UTILITY PAYMENT SCHEMA & INTERFACE
// ==========================================
export interface IUtilityPayment {
  _id: string;
  merchant_id: string; // Ref to Merchant Profile
  sender_id: string; // Ref to User (who paid)
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
    sender_id: { type: String, ref: "User", required: true },
    bill_type: {
      type: String,
      required: true,
      enum: ["ELECTRICITY", "WATER", "INTERNET", "MOBILE_TOPUP", "REMITTANCE"],
    },
    bill_amount: { type: Number, required: true, min: 0 },
    due_date: { type: Date, required: true },
    paid_date: { type: Date },
    payment_status: {
      type: String,
      required: true,
      enum: ["ON_TIME", "LATE", "MISSED", "UNPAID", "PAID_EARLY"],
      default: "UNPAID",
    },
    days_late: { type: Number, default: 0, min: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

utilityPaymentSchema.index({ merchant_id: 1 });
utilityPaymentSchema.index({ sender_id: 1 });

export const UtilityPayment = mongoose.models.UtilityPayment || model<IUtilityPayment>("UtilityPayment", utilityPaymentSchema);

// ==========================================
// 6. WALLET ACTIVITY SCHEMA & INTERFACE
// ==========================================
export interface IWalletActivity {
  _id: string;
  user_id: string; // Ref to centralized User wallet
  activity_type: string;
  amount: number;
  balance_after_transaction: number;
  activity_time: Date;
  created_at: Date;
}

const walletActivitySchema = new Schema<IWalletActivity>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, ref: "User", required: true },
    activity_type: {
      type: String,
      required: true,
      enum: [
        "PAYMENT_RECEIVED", "CASH_IN", "CASH_OUT", "SUPPLIER_PAYMENT",
        "BILL_PAYMENT", "LOAN_REPAYMENT", "REMITTANCE_RECEIVED",
      ],
    },
    amount: { type: Number, required: true, min: 0 },
    balance_after_transaction: { type: Number, required: true },
    activity_time: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

walletActivitySchema.index({ user_id: 1 });
walletActivitySchema.index({ activity_time: -1 });

export const WalletActivity = mongoose.models.WalletActivity || model<IWalletActivity>("WalletActivity", walletActivitySchema);


// ==========================================
// 7. LOAN APPLICATION SCHEMA & INTERFACE
// Needed for requested loan, approved amount, and repayment plan recommendation
// ==========================================
export interface ILoanApplication {
  _id: string;
  loan_application_code: string;
  merchant_id: string; // Ref to Merchant Profile
  requested_amount: number;
  approved_amount?: number;
  loan_purpose: string;
  preferred_repayment_type: string;
  application_status: string;
  applied_at: Date;
  decided_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    _id: { type: String, required: true },
    loan_application_code: { type: String, required: true, unique: true },
    merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    requested_amount: { type: Number, required: true, min: 1000 },
    approved_amount: { type: Number, min: 0, default: 0 },
    loan_purpose: {
      type: String,
      required: true,
      enum: [
        "INVENTORY_PURCHASE",
        "SHOP_EXPANSION",
        "EQUIPMENT_PURCHASE",
        "WORKING_CAPITAL",
        "SEASONAL_STOCK",
        "EMERGENCY_BUSINESS_NEED",
        "OTHER",
      ],
    },
    preferred_repayment_type: {
      type: String,
      required: true,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "SEASONAL"],
    },
    application_status: {
      type: String,
      required: true,
      enum: ["PENDING", "APPROVED", "REVIEW", "REJECTED", "DISBURSED", "CLOSED"],
      default: "PENDING",
    },
    applied_at: { type: Date, default: Date.now },
    decided_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

loanApplicationSchema.index({ merchant_id: 1 });
loanApplicationSchema.index({ application_status: 1 });
loanApplicationSchema.index({ applied_at: -1 });

export const LoanApplication =
  mongoose.models.LoanApplication ||
  model<ILoanApplication>("LoanApplication", loanApplicationSchema);

// ==========================================
// 8. REPAYMENT RECORD SCHEMA & INTERFACE
// This gives the ML model its target label: default or non-default
// ==========================================
export interface IRepaymentRecord {
  _id: string;
  repayment_code: string;
  loan_application_id: string; // Ref to LoanApplication
  merchant_id: string; // Ref to Merchant
  due_amount: number;
  paid_amount: number;
  due_date: Date;
  paid_date?: Date;
  repayment_status: string;
  days_late: number;
  ml_target_default: number; // 0 = non-default, 1 = default
  created_at: Date;
  updated_at: Date;
}

const repaymentRecordSchema = new Schema<IRepaymentRecord>(
  {
    _id: { type: String, required: true },
    repayment_code: { type: String, required: true, unique: true },
    loan_application_id: { type: String, ref: "LoanApplication", required: true, index: true },
    merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    due_amount: { type: Number, required: true, min: 0 },
    paid_amount: { type: Number, required: true, default: 0, min: 0 },
    due_date: { type: Date, required: true },
    paid_date: { type: Date },
    repayment_status: {
      type: String,
      required: true,
      enum: ["PAID_ON_TIME", "PAID_LATE", "MISSED", "DEFAULT", "PENDING"],
      default: "PENDING",
    },
    days_late: { type: Number, required: true, default: 0, min: 0 },
    ml_target_default: { type: Number, required: true, enum: [0, 1], default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

repaymentRecordSchema.index({ merchant_id: 1 });
repaymentRecordSchema.index({ loan_application_id: 1 });
repaymentRecordSchema.index({ repayment_status: 1 });
repaymentRecordSchema.index({ ml_target_default: 1 });

export const RepaymentRecord =
  mongoose.models.RepaymentRecord ||
  model<IRepaymentRecord>("RepaymentRecord", repaymentRecordSchema);

// ==========================================
// 9. SOCIAL EDGE SCHEMA & INTERFACE
// Needed for Community Trust Graph / PageRank / collusion detection
// ==========================================
export interface ISocialEdge {
  _id: string;
  source_merchant_id: string; // Ref to Merchant
  target_entity_type: string; // CUSTOMER, SUPPLIER, GUARANTOR, MERCHANT
  target_entity_id: string; // User ID, Merchant ID, or external supplier ID
  relationship_type: string;
  trust_strength: number; // 1 to 10
  transaction_count?: number;
  total_transaction_value?: number;
  created_at: Date;
}

const socialEdgeSchema = new Schema<ISocialEdge>(
  {
    _id: { type: String, required: true },
    source_merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    target_entity_type: {
      type: String,
      required: true,
      enum: ["CUSTOMER", "SUPPLIER", "GUARANTOR", "MERCHANT"],
    },
    target_entity_id: { type: String, required: true, index: true },
    relationship_type: {
      type: String,
      required: true,
      enum: [
        "REGULAR_CUSTOMER",
        "SUPPLIER",
        "GUARANTOR",
        "BUSINESS_REFERENCE",
        "B2B_COUNTERPARTY",
      ],
    },
    trust_strength: { type: Number, required: true, min: 1, max: 10 },
    transaction_count: { type: Number, default: 0, min: 0 },
    total_transaction_value: { type: Number, default: 0, min: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

socialEdgeSchema.index({ source_merchant_id: 1 });
socialEdgeSchema.index({ target_entity_type: 1 });
socialEdgeSchema.index({ target_entity_id: 1 });
socialEdgeSchema.index({ relationship_type: 1 });

export const SocialEdge =
  mongoose.models.SocialEdge || model<ISocialEdge>("SocialEdge", socialEdgeSchema);

// ==========================================
// 10. PSYCHOMETRIC QUESTION SCHEMA & INTERFACE
// Needed for localized scenario-based questions
// ==========================================
export interface IPsychometricQuestionOption {
  text: string;
  score: number; // 0 to 100 raw score
}

export interface IPsychometricQuestion {
  _id: string;
  question_code: string;
  question_text: string;
  trait_measured: string;
  options: {
    A: IPsychometricQuestionOption;
    B: IPsychometricQuestionOption;
    C: IPsychometricQuestionOption;
    D: IPsychometricQuestionOption;
  };
  best_option: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
        "HONESTY",
        "PLANNING",
        "RISK_CONTROL",
        "REPAYMENT_ATTITUDE",
        "CONSISTENCY",
        "CONSCIENTIOUSNESS",
      ],
    },
    options: {
      A: {
        text: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
      B: {
        text: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
      C: {
        text: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
      D: {
        text: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
    },
    best_option: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

psychometricQuestionSchema.index({ question_code: 1 });
psychometricQuestionSchema.index({ trait_measured: 1 });
psychometricQuestionSchema.index({ is_active: 1 });

export const PsychometricQuestion =
  mongoose.models.PsychometricQuestion ||
  model<IPsychometricQuestion>("PsychometricQuestion", psychometricQuestionSchema);

// ==========================================
// 11. PSYCHOMETRIC ANSWER SCHEMA & INTERFACE
// Stores merchant answers, response timing, and normalized 0-1000 score
// ==========================================
export interface IPsychometricAnswer {
  _id: string;
  merchant_id: string; // Ref to Merchant
  question_id: string; // Ref to PsychometricQuestion
  selected_option: string;
  raw_score: number; // 0 to 100
  normalized_score: number; // 0 to 1000
  response_time_ms: number;
  consistency_flag: boolean;
  answered_at: Date;
  created_at: Date;
}

const psychometricAnswerSchema = new Schema<IPsychometricAnswer>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    question_id: { type: String, ref: "PsychometricQuestion", required: true, index: true },
    selected_option: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    raw_score: { type: Number, required: true, min: 0, max: 100 },
    normalized_score: { type: Number, required: true, min: 0, max: 1000 },
    response_time_ms: { type: Number, required: true, min: 0 },
    consistency_flag: { type: Boolean, default: false },
    answered_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

psychometricAnswerSchema.index({ merchant_id: 1 });
psychometricAnswerSchema.index({ question_id: 1 });
psychometricAnswerSchema.index({ normalized_score: -1 });

export const PsychometricAnswer =
  mongoose.models.PsychometricAnswer ||
  model<IPsychometricAnswer>("PsychometricAnswer", psychometricAnswerSchema);

// ==========================================
// 12. MERCHANT FEATURE SCHEMA & INTERFACE
// ML-ready features generated from backend data/API exports
// ==========================================
export interface IMerchantFeature {
  _id: string;
  merchant_id: string; // Ref to Merchant
  features: {
    monthly_revenue_avg: number;
    active_days_ratio: number;
    transaction_growth_rate: number;
    supplier_payment_ratio: number;
    wallet_velocity_score: number;
    transaction_gravity_score: number;
    liquidity_buffer_score: number;
    remittance_security_score: number;
    airtime_consistency_score: number;
    utility_calibration_score: number;
    micro_obligation_score: number;
    social_pagerank_score: number;
    collusion_safety_score: number;
    guarantor_health_score: number;
    psychometric_avg: number;
    conscientiousness_score: number;
    risk_decision_consistency_score: number;
    customer_diversity_score: number;
    repeat_customer_ratio: number;
    refund_rate: number;
    failed_payment_rate: number;
    cashout_speed_score: number;
    loan_to_income_ratio: number;
    suspicious_spike_score: number;
    seasonal_pattern_score: number;
    repayment_consistency_score: number;
    repayment_plan_daily_fit: number;
    repayment_plan_weekly_fit: number;
    repayment_plan_seasonal_fit: number;
  };
  ml_target: {
    repayment_outcome: string;
    default_probability_label: number;
  };
  created_at: Date;
  updated_at: Date;
}

const merchantFeatureSchema = new Schema<IMerchantFeature>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true, unique: true, index: true },
    features: {
      monthly_revenue_avg: { type: Number, required: true, min: 0 },
      active_days_ratio: { type: Number, required: true, min: 0, max: 1 },
      transaction_growth_rate: { type: Number, required: true, default: 0 },
      supplier_payment_ratio: { type: Number, required: true, min: 0, max: 1 },
      wallet_velocity_score: { type: Number, required: true, min: 0, max: 1 },
      transaction_gravity_score: { type: Number, required: true, min: 0, max: 1 },
      liquidity_buffer_score: { type: Number, required: true, min: 0, max: 1 },
      remittance_security_score: { type: Number, required: true, min: 0, max: 1 },
      airtime_consistency_score: { type: Number, required: true, min: 0, max: 1 },
      utility_calibration_score: { type: Number, required: true, min: 0, max: 1 },
      micro_obligation_score: { type: Number, required: true, min: 0, max: 1 },
      social_pagerank_score: { type: Number, required: true, min: 0, max: 1 },
      collusion_safety_score: { type: Number, required: true, min: 0, max: 1 },
      guarantor_health_score: { type: Number, required: true, min: 0, max: 1 },
      psychometric_avg: { type: Number, required: true, min: 0, max: 1000 },
      conscientiousness_score: { type: Number, required: true, min: 0, max: 1 },
      risk_decision_consistency_score: { type: Number, required: true, min: 0, max: 1 },
      customer_diversity_score: { type: Number, required: true, min: 0, max: 1 },
      repeat_customer_ratio: { type: Number, required: true, min: 0, max: 1 },
      refund_rate: { type: Number, required: true, min: 0, max: 1 },
      failed_payment_rate: { type: Number, required: true, min: 0, max: 1 },
      cashout_speed_score: { type: Number, required: true, min: 0, max: 1 },
      loan_to_income_ratio: { type: Number, required: true, min: 0 },
      suspicious_spike_score: { type: Number, required: true, min: 0, max: 1 },
      seasonal_pattern_score: { type: Number, required: true, min: 0, max: 1 },
      repayment_consistency_score: { type: Number, required: true, min: 0, max: 1 },
      repayment_plan_daily_fit: { type: Number, required: true, min: 0, max: 1 },
      repayment_plan_weekly_fit: { type: Number, required: true, min: 0, max: 1 },
      repayment_plan_seasonal_fit: { type: Number, required: true, min: 0, max: 1 },
    },
    ml_target: {
      repayment_outcome: {
        type: String,
        required: true,
        enum: ["GOOD", "LATE", "DEFAULT"],
      },
      default_probability_label: {
        type: Number,
        required: true,
        enum: [0, 1],
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

merchantFeatureSchema.index({ merchant_id: 1 }, { unique: true });
merchantFeatureSchema.index({ "ml_target.repayment_outcome": 1 });
merchantFeatureSchema.index({ "ml_target.default_probability_label": 1 });

export const MerchantFeature =
  mongoose.models.MerchantFeature ||
  model<IMerchantFeature>("MerchantFeature", merchantFeatureSchema);

// ==========================================
// 13. MODEL PREDICTION SCHEMA & INTERFACE
// Output from trained ML model
// ==========================================
export interface IModelPrediction {
  _id: string;
  merchant_id: string;
  model_version: string;
  default_probability: number;
  repayment_probability: number;
  predicted_class: string;
  confidence: number;
  top_features: {
    feature_name: string;
    contribution: number;
  }[];
  predicted_at: Date;
}

const modelPredictionSchema = new Schema<IModelPrediction>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    model_version: { type: String, required: true, default: "random_forest_v1.0" },
    default_probability: { type: Number, required: true, min: 0, max: 1 },
    repayment_probability: { type: Number, required: true, min: 0, max: 1 },
    predicted_class: {
      type: String,
      required: true,
      enum: ["GOOD", "LATE", "DEFAULT"],
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    top_features: [
      {
        feature_name: { type: String, required: true },
        contribution: { type: Number, required: true },
      },
    ],
    predicted_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

modelPredictionSchema.index({ merchant_id: 1 });
modelPredictionSchema.index({ predicted_class: 1 });
modelPredictionSchema.index({ default_probability: -1 });
modelPredictionSchema.index({ predicted_at: -1 });

export const ModelPrediction =
  mongoose.models.ModelPrediction ||
  model<IModelPrediction>("ModelPrediction", modelPredictionSchema);

// ==========================================
// 14. CREDIT SCORE SCHEMA & INTERFACE
// Final F1-F5 + ML blended Nagarik Credits Score
// ==========================================
export interface ICreditScore {
  _id: string;
  merchant_id: string;
  factor_scores: {
    f1_livelihood_rhythm: number; // max 200
    f2_cash_flow_elasticity: number; // max 180
    f3_smart_digital_footprint: number; // max 220
    f4_community_trust_graph: number; // max 200
    f5_psychometric: number; // max 200
    fraud_penalty: number;
  };
  ml_scores: {
    ml_repayment_score: number;
    default_probability: number;
    repayment_probability: number;
  };
  final_nagarik_credits_score: number;
  risk_band: string;
  decision: string;
  suggested_loan_amount: number;
  repayment_plan: string;
  fraud_flags: string[];
  explanation: string;
  calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const creditScoreSchema = new Schema<ICreditScore>(
  {
    _id: { type: String, required: true },
    merchant_id: { type: String, ref: "Merchant", required: true, index: true },
    factor_scores: {
      f1_livelihood_rhythm: { type: Number, required: true, min: 0, max: 200 },
      f2_cash_flow_elasticity: { type: Number, required: true, min: 0, max: 180 },
      f3_smart_digital_footprint: { type: Number, required: true, min: 0, max: 220 },
      f4_community_trust_graph: { type: Number, required: true, min: 0, max: 200 },
      f5_psychometric: { type: Number, required: true, min: 0, max: 200 },
      fraud_penalty: { type: Number, required: true, min: 0, max: 250 },
    },
    ml_scores: {
      ml_repayment_score: { type: Number, required: true, min: 0, max: 1000 },
      default_probability: { type: Number, required: true, min: 0, max: 1 },
      repayment_probability: { type: Number, required: true, min: 0, max: 1 },
    },
    final_nagarik_credits_score: { type: Number, required: true, min: 0, max: 1000 },
    risk_band: {
      type: String,
      required: true,
      enum: ["PLATINUM", "GOLD", "SILVER", "BRONZE", "WATCH", "THIN_FILE"],
    },
    decision: {
      type: String,
      required: true,
      enum: ["APPROVED", "REVIEW", "REJECTED", "MICRO_CREDIT_ONLY"],
    },
    suggested_loan_amount: { type: Number, required: true, min: 0 },
    repayment_plan: {
      type: String,
      required: true,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "SEASONAL", "NONE"],
    },
    fraud_flags: { type: [String], default: [] },
    explanation: { type: String, required: true },
    calculated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    _id: false,
  }
);

creditScoreSchema.index({ merchant_id: 1 });
creditScoreSchema.index({ risk_band: 1 });
creditScoreSchema.index({ decision: 1 });
creditScoreSchema.index({ final_nagarik_credits_score: -1 });
creditScoreSchema.index({ "factor_scores.fraud_penalty": -1 });

export const CreditScore =
  mongoose.models.CreditScore || model<ICreditScore>("CreditScore", creditScoreSchema);

// ==========================================
// 15. ML TRAINING RUN SCHEMA & INTERFACE
// Tracks training history and model quality metrics
// ==========================================
export interface IMLTrainingRun {
  _id: string;
  model_version: string;
  algorithm: string;
  training_records: number;
  feature_count: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  artifact_path?: string;
  trained_at: Date;
  created_at: Date;
}

const mlTrainingRunSchema = new Schema<IMLTrainingRun>(
  {
    _id: { type: String, required: true },
    model_version: { type: String, required: true, unique: true },
    algorithm: {
      type: String,
      required: true,
      enum: ["RandomForest", "XGBoost", "LogisticRegression", "LightGBM", "GradientBoosting", "IsolationForest"],
    },
    training_records: { type: Number, required: true, min: 0 },
    feature_count: { type: Number, required: true, min: 0 },
    metrics: {
      accuracy: { type: Number, required: true, min: 0, max: 1 },
      precision: { type: Number, required: true, min: 0, max: 1 },
      recall: { type: Number, required: true, min: 0, max: 1 },
      f1_score: { type: Number, required: true, min: 0, max: 1 },
      roc_auc: { type: Number, required: true, min: 0, max: 1 },
    },
    artifact_path: { type: String },
    trained_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

mlTrainingRunSchema.index({ model_version: 1 }, { unique: true });
mlTrainingRunSchema.index({ algorithm: 1 });
mlTrainingRunSchema.index({ trained_at: -1 });

export const MLTrainingRun =
  mongoose.models.MLTrainingRun ||
  model<IMLTrainingRun>("MLTrainingRun", mlTrainingRunSchema);
