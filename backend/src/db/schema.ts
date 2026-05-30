import mongoose, { Schema, model } from "mongoose";

// ==========================================
// 1. CENTRALIZED USER SCHEMA & INTERFACE
// ==========================================
export interface IUser {
  _id: string; // Custom ID like USR-00001
  user_code: string;
  name: string;
  phone: string;
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
    user_type: {
      type: String,
      required: true,
      enum: ["MERCHANT", "CUSTOMER", "BOTH"],
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
        "TEA_SHOP", "GROCERY", "RESTAURANT", "VEGETABLE_SHOP", "PHARMACY",
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
      enum: ["ELECTRICITY", "WATER", "INTERNET", "MOBILE_TOPUP"],
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
        "BILL_PAYMENT", "LOAN_REPAYMENT",
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
