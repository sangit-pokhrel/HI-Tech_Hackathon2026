import {
  User,
  Merchant,
  Transaction,
  WalletActivity,
  CreditScore,
  PsychometricQuestion,
  UtilityPayment,
  PsychometricAnswer,
  ModelPrediction,
} from "../db/schema";
import { processTransactionRecord } from "./transaction.controller";

type SubmittedAnswer = {
  question_id: string;
  selected_option: string;
  option_score: number;
};

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || "http://localhost:9000").replace(/\/$/, "");

// ==========================================
// HELPERS
// ==========================================

const classifyDataTier = (walletAgeMonths: number, txnCount: number): "RICH" | "THIN" | "ZERO" => {
  if (walletAgeMonths === 0 && txnCount === 0) return "ZERO";
  if (walletAgeMonths >= 3 && txnCount >= 10) return "RICH";
  return "THIN";
};

const questionsForTier = (tier: "RICH" | "THIN" | "ZERO"): number => {
  if (tier === "RICH") return 2;
  if (tier === "THIN") return 4;
  return 7;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const getMonthAgeFromDate = (date: Date | string | undefined | null) => {
  if (!date) return 0;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 0;

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs <= 0) return 1;

  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
};

const deriveAvgPsychometricScore = (answers: SubmittedAnswer[]): number => {
  if (!answers || answers.length === 0) return 500;
  const avg = answers.reduce((sum, answer) => sum + answer.option_score, 0) / answers.length;
  return Math.round(avg * 10);
};

const canAccessUserScore = (sessionUser: any, targetUserId: string) =>
  sessionUser?.user_type === "ADMIN" || sessionUser?.id === targetUserId;

const ensureAuthorizedScoreAccess = (sessionUser: any, targetUserId: string, set: any) => {
  if (canAccessUserScore(sessionUser, targetUserId)) return true;
  set.status = 403;
  return false;
};

const shouldForceScoreRefresh = (query: any) => {
  const refresh = String(query?.refresh ?? "").toLowerCase();
  return ["1", "true", "yes", "live"].includes(refresh);
};

const buildPredictionRecord = (merchantId: string, mlResult: any) => {
  const probabilities = mlResult.probabilities ?? {};
  const loan = mlResult.loan_recommendation ?? {};
  const repaymentProbability = probabilities.repayment_probability ?? 0.5;

  return {
    _id: merchantId,
    merchant_id: merchantId,
    model_version: "credit_risk_model.pkl",
    default_probability: probabilities.default_probability ?? 0.5,
    repayment_probability: repaymentProbability,
    predicted_class: loan.decision ?? "REVIEW",
    confidence: repaymentProbability,
    top_features: [],
  };
};

const mapMlResultToScoreResponse = (
  user: any,
  scoreOwnerId: string,
  mlResult: any,
  extra: Record<string, any> = {}
) => {
  const scores = mlResult.scores ?? {};
  const probabilities = mlResult.probabilities ?? {};
  const loan = mlResult.loan_recommendation ?? {};
  const explanation = mlResult.explanation ?? {};
  const fraudFlags = mlResult.fraud_flags ?? [];

  const score =
    scores.final_nagarik_credits_score ??
    scores.rule_based_nagarik_credits_score ??
    scores.ml_repayment_score ??
    0;
  const scoreBand = loan.risk_band ?? "THIN_FILE";
  const decision = loan.decision ?? "REVIEW";

  return {
    success: true,
    customer_id: user._id,
    customer_type: user.user_type,
    score_owner_id: scoreOwnerId,
    score,
    score_band: scoreBand,
    confidence_interval: extra.confidence_interval ?? 30,
    ml_prediction: {
      default_probability: probabilities.default_probability ?? 0.5,
      repayment_probability: probabilities.repayment_probability ?? 0.5,
      predicted_class: decision,
      confidence: probabilities.repayment_probability ?? 0.5,
      top_features: [],
    },
    factor_breakdown: {
      F1_transaction_consistency: { score: scores.f1_livelihood_rhythm ?? 0, max: 220 },
      F2_cashflow_health: { score: scores.f2_cash_flow_elasticity ?? 0, max: 195 },
      F3_payment_reliability: { score: scores.f3_smart_digital_footprint ?? 0, max: 245 },
      F4_integrity: {
        score: scores.f4_community_trust_graph ?? Math.max(0, 215 - (scores.fraud_penalty ?? 0)),
        max: 215,
        flags: fraudFlags,
      },
      F5_external_signals: { score: scores.f5_psychometric ?? 0, max: 125 },
      F6_b2b_feedback: { score: 0, max: 80, notes: "not active - redistributed" },
    },
    top_improvement_action:
      explanation.summary || "Maintain regular transaction operations to build up scoring index.",
    explanation_summary:
      explanation.summary || "Nagarik Credits score computed from merchant behavior and ML signals.",
    positive_factors: explanation.positive_factors ?? [],
    risk_factors: explanation.risk_factors ?? [],
    flags: fraudFlags,
    suggested_loan_amount: loan.suggested_loan_amount ?? 0,
    repayment_plan: loan.repayment_plan ?? "WEEKLY",
    data_gaps: [],
    score_source: extra.score_source ?? "live",
    calculated_at: extra.calculated_at ?? new Date().toISOString(),
    ...extra,
  };
};

const mapStoredScoreToResponse = (user: any, creditScore: any, extra: Record<string, any> = {}) => {
  const fraudFlags = creditScore.fraud_flags || [];
  const factorScores = creditScore.factor_scores || {};
  const mlScores = creditScore.ml_scores || {};
  const score = creditScore.final_nagarik_credits_score || 0;

  return {
    success: true,
    customer_id: user._id,
    customer_type: user.user_type,
    score_owner_id: creditScore.merchant_id,
    score,
    confidence_interval: 30,
    score_band: creditScore.risk_band,
    ml_prediction: {
      default_probability: mlScores.default_probability ?? 0.5,
      repayment_probability: mlScores.repayment_probability ?? 0.5,
      predicted_class: creditScore.decision ?? "REVIEW",
      confidence: mlScores.repayment_probability ?? 0.5,
      top_features: [],
    },
    factor_breakdown: {
      F1_transaction_consistency: {
        score: factorScores.f1_livelihood_rhythm || 120,
        max: 220,
        notes: "Dynamically mapped from the latest merchant feature set.",
      },
      F2_cashflow_health: {
        score: factorScores.f2_cash_flow_elasticity || 110,
        max: 195,
        notes: "Derived from current wallet and transaction liquidity behavior.",
      },
      F3_payment_reliability: {
        score: factorScores.f3_smart_digital_footprint || 150,
        max: 245,
        notes: "Backed by utility timeliness and digital repayment signals.",
      },
      F4_integrity: {
        score: factorScores.f4_community_trust_graph || Math.max(0, 215 - (factorScores.fraud_penalty || 0)),
        max: 215,
        flags: fraudFlags,
        notes:
          fraudFlags.length > 0
            ? `Integrity flags flagged: ${fraudFlags.join(", ")}.`
            : "No integrity flags detected.",
      },
      F5_external_signals: {
        score: factorScores.f5_psychometric || 80,
        max: 125,
        notes: "Psychometric and external merchant signals are blended here.",
      },
      F6_b2b_feedback: { score: 0, max: 80, notes: "not active - redistributed" },
    },
    top_improvement_action:
      creditScore.explanation || "Maintain regular transaction operations to build up scoring index.",
    explanation_summary:
      creditScore.explanation || "Latest merchant score loaded from the persisted ML scoring record.",
    positive_factors: [],
    risk_factors: [],
    flags: fraudFlags,
    suggested_loan_amount: creditScore.suggested_loan_amount ?? 0,
    repayment_plan: creditScore.repayment_plan ?? "WEEKLY",
    data_gaps: [],
    score_source: extra.score_source ?? "stored",
    calculated_at: creditScore.calculated_at ?? null,
    ...extra,
  };
};

const callMlService = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, init);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `ML service returned status ${response.status}`);
  }
  return response.json();
};

const persistMlScoreResult = async (scoreOwnerId: string, mlResult: any) => {
  const scores = mlResult.scores ?? {};
  const probabilities = mlResult.probabilities ?? {};
  const loan = mlResult.loan_recommendation ?? {};
  const explanation = mlResult.explanation ?? {};
  const fraudFlags = mlResult.fraud_flags ?? [];

  const finalScore =
    scores.final_nagarik_credits_score ??
    scores.rule_based_nagarik_credits_score ??
    scores.ml_repayment_score ??
    0;

  await CreditScore.findByIdAndUpdate(
    scoreOwnerId,
    {
      _id: scoreOwnerId,
      merchant_id: scoreOwnerId,
      factor_scores: {
        f1_livelihood_rhythm: scores.f1_livelihood_rhythm ?? 0,
        f2_cash_flow_elasticity: scores.f2_cash_flow_elasticity ?? 0,
        f3_smart_digital_footprint: scores.f3_smart_digital_footprint ?? 0,
        f4_community_trust_graph: scores.f4_community_trust_graph ?? 0,
        f5_psychometric: scores.f5_psychometric ?? 0,
        fraud_penalty: scores.fraud_penalty ?? 0,
      },
      ml_scores: {
        ml_repayment_score: scores.ml_repayment_score ?? finalScore,
        default_probability: probabilities.default_probability ?? 0.5,
        repayment_probability: probabilities.repayment_probability ?? 0.5,
      },
      final_nagarik_credits_score: finalScore,
      risk_band: loan.risk_band ?? "THIN_FILE",
      decision: loan.decision ?? "REVIEW",
      suggested_loan_amount: loan.suggested_loan_amount ?? 0,
      repayment_plan: loan.repayment_plan ?? "WEEKLY",
      fraud_flags: fraudFlags,
      explanation:
        explanation.summary || "Nagarik Credits score computed from merchant behavior and ML signals.",
      calculated_at: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  await ModelPrediction.findByIdAndUpdate(scoreOwnerId, buildPredictionRecord(scoreOwnerId, mlResult), {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};

const getStoredPsychometricProfile = async (merchantId: string) => {
  const answers = await PsychometricAnswer.find({ merchant_id: merchantId }).lean();
  if (answers.length === 0) {
    return {
      psychometric_avg: 500,
      conscientiousness_score: 0.5,
      risk_decision_consistency_score: 0.5,
    };
  }

  const psychometricAvg = Math.round(
    answers.reduce((sum: number, answer: any) => sum + (answer.normalized_score || answer.raw_score * 10 || 500), 0) /
      answers.length
  );
  const consistencyFlagAverage =
    answers.reduce((sum: number, answer: any) => sum + (answer.consistency_flag ? 1 : 0), 0) / answers.length;

  return {
    psychometric_avg: psychometricAvg,
    conscientiousness_score: clamp(psychometricAvg / 1000),
    risk_decision_consistency_score: clamp(1 - consistencyFlagAverage),
  };
};

const getUserScoringSignals = async (user: any, merchant: any) => {
  const userId = user._id.toString();

  const [transactions, walletActivities, utilityPayments] = await Promise.all([
    Transaction.find({
      $or: [{ sender_id: userId }, { receiver_id: userId }],
    })
      .sort({ transaction_time: -1 })
      .limit(300)
      .lean(),
    WalletActivity.find({ user_id: userId })
      .sort({ activity_time: -1 })
      .limit(300)
      .lean(),
    UtilityPayment.find({ sender_id: userId })
      .sort({ created_at: -1 })
      .limit(150)
      .lean(),
  ]);

  const signalDates = [
    ...transactions.map((tx: any) => tx.transaction_time),
    ...walletActivities.map((activity: any) => activity.activity_time || activity.created_at),
    ...utilityPayments.map((payment: any) => payment.paid_date || payment.created_at || payment.due_date),
  ].filter(Boolean);

  const earliestSignal = signalDates.length
    ? signalDates.reduce((earliest: Date, current: any) => {
        const currentDate = new Date(current);
        return currentDate < earliest ? currentDate : earliest;
      }, new Date(signalDates[0]))
    : null;

  const walletAgeMonths =
    merchant?.wallet_age_months && merchant.wallet_age_months > 0
      ? merchant.wallet_age_months
      : earliestSignal
      ? getMonthAgeFromDate(earliestSignal)
      : 0;

  return {
    walletAgeMonths,
    txnCount: transactions.length,
    transactions,
    walletActivities,
    utilityPayments,
  };
};

const buildRealTimePayload = async (
  user: any,
  merchant: any,
  signals: {
    walletAgeMonths: number;
    txnCount: number;
    transactions: any[];
    walletActivities: any[];
    utilityPayments: any[];
  },
  psychometricProfile: {
    psychometric_avg: number;
    conscientiousness_score: number;
    risk_decision_consistency_score: number;
  }
) => {
  const userId = user._id.toString();
  const { walletAgeMonths, txnCount, transactions, walletActivities, utilityPayments } = signals;
  const businessType = merchant?.business_type || "OTHER";

  const activeDaySet = new Set<string>();
  transactions.forEach((tx: any) => {
    if (tx.transaction_time) activeDaySet.add(new Date(tx.transaction_time).toISOString().slice(0, 10));
  });
  walletActivities.forEach((activity: any) => {
    const date = activity.activity_time || activity.created_at;
    if (date) activeDaySet.add(new Date(date).toISOString().slice(0, 10));
  });

  const activeDays = activeDaySet.size;
  const activeDayReference = Math.min(Math.max(walletAgeMonths, 1) * 15, 180);
  const activeDaysRatio = clamp(activeDays / Math.max(activeDayReference, 1));

  const incomingTransactions = transactions.filter((tx: any) => tx.receiver_id === userId);
  const outgoingTransactions = transactions.filter((tx: any) => tx.sender_id === userId);
  const successfulTransactions = transactions.filter((tx: any) => tx.status !== "FAILED");

  const counterpartyCounts = transactions.reduce((acc: Map<string, number>, tx: any) => {
    const counterparty = tx.sender_id === userId ? tx.receiver_id : tx.sender_id;
    if (counterparty) acc.set(counterparty, (acc.get(counterparty) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  const uniqueCounterparties = counterpartyCounts.size;
  const repeatCounterpartyCount = Array.from(counterpartyCounts.values()).filter((count) => count > 1).length;

  const walletReceived = walletActivities
    .filter((activity: any) =>
      ["PAYMENT_RECEIVED", "CASH_IN", "REMITTANCE_RECEIVED"].includes(activity.activity_type)
    )
    .reduce((sum: number, activity: any) => sum + activity.amount, 0);
  const transactionReceived = incomingTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalReceived = Math.max(walletReceived, transactionReceived);

  const walletOutgoing = walletActivities
    .filter((activity: any) =>
      ["CASH_OUT", "SUPPLIER_PAYMENT", "BILL_PAYMENT", "LOAN_REPAYMENT"].includes(activity.activity_type)
    )
    .reduce((sum: number, activity: any) => sum + activity.amount, 0);
  const transactionOutgoing = outgoingTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalOutgoing = Math.max(walletOutgoing, transactionOutgoing);

  const monthlyRevenueAvg = walletAgeMonths > 0 ? totalReceived / walletAgeMonths : totalReceived;
  const paymentChannelCount =
    new Set(successfulTransactions.map((tx: any) => tx.payment_channel).filter(Boolean)).size || 1;

  const supplierOutflow = outgoingTransactions
    .filter((tx: any) => tx.transaction_type === "SUPPLIER_PAYMENT")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalTxnAmount = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const transactionGravityScore = clamp(uniqueCounterparties / 25);
  const customerDiversityScore = clamp((uniqueCounterparties / Math.max(txnCount, 1)) * 5);
  const repeatCustomerRatio = clamp(repeatCounterpartyCount / Math.max(uniqueCounterparties, 1));

  const refundRate = clamp(
    transactions.filter((tx: any) => tx.transaction_type === "REFUND").length / Math.max(txnCount, 1)
  );
  const failedPaymentRate = clamp(
    transactions.filter((tx: any) => tx.status === "FAILED").length / Math.max(txnCount, 1)
  );

  const dailyTotals = transactions.reduce((acc: Map<string, number>, tx: any) => {
    const dateKey = new Date(tx.transaction_time).toISOString().slice(0, 10);
    acc.set(dateKey, (acc.get(dateKey) || 0) + (tx.amount || 0));
    return acc;
  }, new Map<string, number>());
  const dailyAmounts = Array.from(dailyTotals.values());
  const avgDailyAmount = dailyAmounts.length
    ? dailyAmounts.reduce((sum, amount) => sum + amount, 0) / dailyAmounts.length
    : 0;
  const maxDailyAmount = dailyAmounts.length ? Math.max(...dailyAmounts) : 0;
  const suspiciousSpikeScore =
    avgDailyAmount > 0 ? clamp((maxDailyAmount - avgDailyAmount) / (avgDailyAmount * 4)) : 0;

  const now = Date.now();
  const recentWindowMs = 1000 * 60 * 60 * 24 * 30;
  const recentTxCount = transactions.filter((tx: any) => {
    if (!tx.transaction_time) return false;
    return now - new Date(tx.transaction_time).getTime() <= recentWindowMs;
  }).length;
  const previousTxCount = transactions.filter((tx: any) => {
    if (!tx.transaction_time) return false;
    const age = now - new Date(tx.transaction_time).getTime();
    return age > recentWindowMs && age <= recentWindowMs * 2;
  }).length;

  const transactionGrowthRate =
    previousTxCount > 0
      ? clamp((recentTxCount - previousTxCount) / previousTxCount, -1, 1)
      : recentTxCount > 0
      ? 0.35
      : 0;

  const walletVelocityScore =
    totalReceived > 0 ? clamp(Math.min(totalReceived, totalOutgoing) / totalReceived) : txnCount > 0 ? 0.55 : 0.25;

  const cashoutAmount = walletActivities
    .filter((activity: any) => activity.activity_type === "CASH_OUT")
    .reduce((sum: number, activity: any) => sum + activity.amount, 0);
  const cashoutSpeedScore =
    totalReceived > 0 ? clamp(1 - cashoutAmount / Math.max(totalReceived, 1)) : txnCount > 0 ? 0.6 : 0.4;

  const balances = walletActivities
    .map((activity: any) => activity.balance_after_transaction)
    .filter((balance: any) => typeof balance === "number");
  const avgBalance = balances.length
    ? balances.reduce((sum: number, balance: number) => sum + balance, 0) / balances.length
    : 0;
  const stdBalance = balances.length
    ? Math.sqrt(
        balances.reduce((sum: number, balance: number) => sum + Math.pow(balance - avgBalance, 2), 0) /
          balances.length
      )
    : 0;
  const liquidityBufferScore = balances.length
    ? clamp(1 - stdBalance / Math.max(avgBalance, 1))
    : txnCount > 0
    ? 0.55
    : 0.3;

  const remittanceAmount = walletActivities
    .filter((activity: any) => activity.activity_type === "REMITTANCE_RECEIVED")
    .reduce((sum: number, activity: any) => sum + activity.amount, 0);
  const remittanceSecurityScore = clamp(remittanceAmount / 50000);

  const utilityDelayAvg = utilityPayments.length
    ? utilityPayments.reduce((sum: number, payment: any) => sum + (payment.days_late || 0), 0) /
      utilityPayments.length
    : null;
  const utilityCalibrationScore = utilityDelayAvg === null ? 0.55 : clamp(1 - utilityDelayAvg / 30);

  const airtimePayments = utilityPayments.filter((payment: any) => payment.bill_type === "MOBILE_TOPUP");
  const airtimeConsistencyScore = utilityPayments.length
    ? clamp(airtimePayments.length / Math.max(walletAgeMonths * 4, 1))
    : 0.55;

  const recurringBills = utilityPayments.filter((payment: any) =>
    ["INTERNET", "ELECTRICITY", "WATER"].includes(payment.bill_type)
  );
  const reliableRecurringBills = recurringBills.filter((payment: any) =>
    ["ON_TIME", "PAID_EARLY"].includes(payment.payment_status)
  );
  const microObligationScore = recurringBills.length
    ? clamp(reliableRecurringBills.length / recurringBills.length)
    : 0.55;

  const utilityStatuses = utilityPayments.map((payment: any) => payment.payment_status);
  const reliableUtilityCount = utilityStatuses.filter((status: string) =>
    ["ON_TIME", "PAID_EARLY"].includes(status)
  ).length;
  const partialUtilityCount = utilityStatuses.filter((status: string) => status === "LATE").length;
  const repaymentConsistencyScore = utilityStatuses.length
    ? clamp((reliableUtilityCount + partialUtilityCount * 0.5) / utilityStatuses.length)
    : 0.6;

  return {
    merchant_id: merchant?._id || userId,
    merchant_code: merchant?.merchant_code || user.user_code || userId,
    merchant_user_id: userId,
    business_type: businessType,
    wallet_age_months: walletAgeMonths,
    monthly_revenue_avg: monthlyRevenueAvg,
    active_days: activeDays,
    active_days_ratio: activeDaysRatio,
    transaction_growth_rate: transactionGrowthRate,
    payment_channel_count: paymentChannelCount,
    supplier_payment_ratio: clamp(supplierOutflow / Math.max(totalTxnAmount, 1)),
    wallet_velocity_score: walletVelocityScore,
    transaction_gravity_score: transactionGravityScore,
    liquidity_buffer_score: liquidityBufferScore,
    remittance_security_score: remittanceSecurityScore,
    airtime_consistency_score: airtimeConsistencyScore,
    utility_calibration_score: utilityCalibrationScore,
    micro_obligation_score: microObligationScore,
    social_pagerank_score: uniqueCounterparties > 0 ? clamp(0.35 + uniqueCounterparties / 40) : 0.35,
    collusion_safety_score: customerDiversityScore > 0 ? customerDiversityScore : 0.5,
    guarantor_health_score: repeatCustomerRatio > 0 ? clamp(0.45 + repeatCustomerRatio * 0.35) : 0.45,
    collusion_risk_score: customerDiversityScore > 0 ? clamp(1 - customerDiversityScore) : 0.5,
    psychometric_avg: psychometricProfile.psychometric_avg,
    conscientiousness_score: psychometricProfile.conscientiousness_score,
    risk_decision_consistency_score: psychometricProfile.risk_decision_consistency_score,
    customer_diversity_score: customerDiversityScore,
    repeat_customer_ratio: repeatCustomerRatio,
    refund_rate: refundRate,
    failed_payment_rate: failedPaymentRate,
    cashout_speed_score: cashoutSpeedScore,
    loan_to_income_ratio: 0.0,
    suspicious_spike_score: suspiciousSpikeScore,
    seasonal_pattern_score: ["AGRICULTURE", "VEGETABLE_SHOP", "FRUIT_SHOP"].includes(businessType) ? 0.85 : 0.5,
    repayment_consistency_score: repaymentConsistencyScore,
    repayment_plan_daily_fit: 0.35,
    repayment_plan_weekly_fit: 0.45,
    repayment_plan_seasonal_fit: 0.2,
  };
};

const savePsychometricAnswers = async (merchantId: string, answers: SubmittedAnswer[]) => {
  if (!answers.length) return;

  const questionIds = answers.map((answer) => answer.question_id);
  await PsychometricAnswer.deleteMany({
    merchant_id: merchantId,
    question_id: { $in: questionIds },
  });

  await PsychometricAnswer.insertMany(
    answers.map((answer) => ({
      _id: `PSY-${crypto.randomUUID().slice(0, 8)}`,
      merchant_id: merchantId,
      question_id: answer.question_id,
      selected_option: answer.selected_option,
      raw_score: answer.option_score,
      normalized_score: answer.option_score * 10,
      response_time_ms: 15000,
      consistency_flag: false,
      answered_at: new Date(),
      created_at: new Date(),
    }))
  );
};

const ensureMerchantProfile = async (user: any) => {
  let merchant = await Merchant.findOne({ user_id: user._id });
  if (merchant || !["MERCHANT", "BOTH"].includes(user.user_type)) return merchant;

  const count = await Merchant.countDocuments();
  const merchantId = `MRC-${String(count + 1).padStart(5, "0")}`;
  const createdAt = user.created_at || new Date();

  merchant = await Merchant.create({
    _id: merchantId,
    user_id: user._id,
    merchant_code: merchantId,
    merchant_name: user.name || `${user.user_code} Merchant`,
    business_type: "OTHER",
    registration_status: "in_process",
    wallet_age_months: getMonthAgeFromDate(createdAt),
    business_started_year: new Date(createdAt).getFullYear(),
    is_active: true,
  });

  return merchant;
};

const fetchLiveMerchantScore = async (user: any, merchant: any) => {
  const liveResult = await callMlService(`/predict/live/${encodeURIComponent(merchant.merchant_code)}`);
  await persistMlScoreResult(merchant._id.toString(), liveResult);
  return mapMlResultToScoreResponse(user, merchant._id.toString(), liveResult);
};

const fetchRealtimeMerchantScoreFallback = async (user: any, merchant: any) => {
  const signals = await getUserScoringSignals(user, merchant);
  const psychometricProfile = await getStoredPsychometricProfile(merchant._id.toString());
  const payload = await buildRealTimePayload(user, merchant, signals, psychometricProfile);
  const realtimeResult = await callMlService("/predict/realtime", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await persistMlScoreResult(merchant._id.toString(), realtimeResult);
  return mapMlResultToScoreResponse(user, merchant._id.toString(), realtimeResult, {
    data_profile: {
      wallet_age_months: signals.walletAgeMonths,
      transaction_count: signals.txnCount,
      tier: classifyDataTier(signals.walletAgeMonths, signals.txnCount),
      psychometric_avg: psychometricProfile.psychometric_avg,
    },
  });
};

const getNoScoreAssessment = async (user: any, merchant: any, set: any) => {
  const signals = await getUserScoringSignals(user, merchant);
  const dataTier = classifyDataTier(signals.walletAgeMonths, signals.txnCount);
  const questionsNeeded = questionsForTier(dataTier);

  const dbQuestions = await PsychometricQuestion.find({ is_active: true })
    .sort({ question_code: 1 })
    .limit(questionsNeeded)
    .lean();

  set.status = 404;
  return {
    success: false,
    error_code: "NO_SCORE_RECORD",
    message: "No pre-calculated credit score record found. Please complete the psychometric assessment.",
    data_profile: {
      wallet_age_months: signals.walletAgeMonths,
      transaction_count: signals.txnCount,
      tier: dataTier,
      questions_needed: questionsNeeded,
      has_merchant_profile: !!merchant,
      merchant_id: merchant?._id ?? null,
    },
    psychometric_questions: dbQuestions,
  };
};

const findBestDemoCounterparty = async (merchantUserId: string, amount: number) => {
  return User.findOne({
    _id: { $ne: merchantUserId },
    verified_status: "verified",
    is_active: true,
    balance: { $gte: amount },
    user_type: { $in: ["CUSTOMER", "BOTH", "MERCHANT"] },
  }).sort({ balance: -1 });
};

// ==========================================
// GET: Retrieve score
// ==========================================
export const getNagarikCreditsScore = async ({ params: { id }, query, set, user: sessionUser }: any) => {
  try {
    if (!ensureAuthorizedScoreAccess(sessionUser, id, set)) {
      return { success: false, message: "Forbidden" };
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    if (targetUser.verified_status !== "verified") {
      set.status = 400;
      return { success: false, message: "Scoring requires a KYC verified user profile" };
    }

    const merchant = await ensureMerchantProfile(targetUser);
    const forceRefresh = shouldForceScoreRefresh(query);
    const storedCreditScore = await CreditScore.findOne({
      merchant_id: merchant ? { $in: [merchant._id, id] } : id,
    });

    if (storedCreditScore && !forceRefresh) {
      return mapStoredScoreToResponse(targetUser, storedCreditScore);
    }

    if (merchant) {
      try {
        return await fetchLiveMerchantScore(targetUser, merchant);
      } catch {
        try {
          return await fetchRealtimeMerchantScoreFallback(targetUser, merchant);
        } catch (fallbackError) {
          if (storedCreditScore) {
            return mapStoredScoreToResponse(targetUser, storedCreditScore, {
              score_source: "stored_fallback",
              warning: "Showing the last saved score because live scoring is currently unavailable.",
            });
          }

          set.status = 502;
          return {
            success: false,
            message:
              fallbackError instanceof Error
                ? fallbackError.message
                : "ML service is unavailable for live merchant scoring",
          };
        }
      }
    }

    if (storedCreditScore) {
      return mapStoredScoreToResponse(targetUser, storedCreditScore);
    }

    return getNoScoreAssessment(targetUser, merchant, set);
  } catch (error: any) {
    set.status = 500;
    return { success: false, message: error.message || "Failed to retrieve Nagarik Credits score" };
  }
};

// ==========================================
// POST: Compute score from psychometric answers
// ==========================================
export const computeNagarikCreditsScore = async ({
  params: { id },
  body,
  set,
  user: sessionUser,
}: any) => {
  try {
    if (!ensureAuthorizedScoreAccess(sessionUser, id, set)) {
      return { success: false, message: "Forbidden" };
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    if (targetUser.verified_status !== "verified") {
      set.status = 400;
      return { success: false, message: "Scoring requires a KYC verified user profile" };
    }

    const answers: SubmittedAnswer[] = body.answers || [];
    const merchant = await ensureMerchantProfile(targetUser);

    if (merchant) {
      await savePsychometricAnswers(merchant._id.toString(), answers);

      try {
        return {
          ...(await fetchLiveMerchantScore(targetUser, merchant)),
          computed: true,
          data_profile: {
            wallet_age_months: merchant.wallet_age_months,
            transaction_count: await Transaction.countDocuments({
              $or: [{ sender_id: id }, { receiver_id: id }],
            }),
            tier: classifyDataTier(
              merchant.wallet_age_months,
              await Transaction.countDocuments({ $or: [{ sender_id: id }, { receiver_id: id }] })
            ),
            psychometric_questions_answered: answers.length,
            psychometric_avg: deriveAvgPsychometricScore(answers),
          },
        };
      } catch {
        const signals = await getUserScoringSignals(targetUser, merchant);
        const psychometricProfile = {
          psychometric_avg: deriveAvgPsychometricScore(answers),
          conscientiousness_score: clamp(deriveAvgPsychometricScore(answers) / 1000),
          risk_decision_consistency_score: (() => {
            const optionScores = answers.map((answer) => answer.option_score);
            const maxScore = Math.max(...(optionScores.length ? optionScores : [50]));
            const minScore = Math.min(...(optionScores.length ? optionScores : [50]));
            const scoreRange = maxScore - minScore;
            return scoreRange <= 30 ? 0.8 : scoreRange <= 60 ? 0.6 : 0.4;
          })(),
        };

        const payload = await buildRealTimePayload(targetUser, merchant, signals, psychometricProfile);
        const realtimeResult = await callMlService("/predict/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await persistMlScoreResult(merchant._id.toString(), realtimeResult);

        return {
          ...mapMlResultToScoreResponse(targetUser, merchant._id.toString(), realtimeResult, {
            data_profile: {
              wallet_age_months: signals.walletAgeMonths,
              transaction_count: signals.txnCount,
              tier: classifyDataTier(signals.walletAgeMonths, signals.txnCount),
              psychometric_questions_answered: answers.length,
              psychometric_avg: psychometricProfile.psychometric_avg,
            },
          }),
          computed: true,
        };
      }
    }

    const psychometricProfile = {
      psychometric_avg: deriveAvgPsychometricScore(answers),
      conscientiousness_score: clamp(deriveAvgPsychometricScore(answers) / 1000),
      risk_decision_consistency_score: (() => {
        const optionScores = answers.map((answer) => answer.option_score);
        const maxScore = Math.max(...(optionScores.length ? optionScores : [50]));
        const minScore = Math.min(...(optionScores.length ? optionScores : [50]));
        const scoreRange = maxScore - minScore;
        return scoreRange <= 30 ? 0.8 : scoreRange <= 60 ? 0.6 : 0.4;
      })(),
    };
    const signals = await getUserScoringSignals(targetUser, null);
    const payload = await buildRealTimePayload(
      targetUser,
      { business_type: body.business_type || "OTHER" },
      signals,
      psychometricProfile
    );

    const realtimeResult = await callMlService("/predict/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await persistMlScoreResult(id, realtimeResult);

    return {
      ...mapMlResultToScoreResponse(targetUser, id, realtimeResult, {
        data_profile: {
          wallet_age_months: signals.walletAgeMonths,
          transaction_count: signals.txnCount,
          tier: classifyDataTier(signals.walletAgeMonths, signals.txnCount),
          psychometric_questions_answered: answers.length,
          psychometric_avg: psychometricProfile.psychometric_avg,
        },
      }),
      computed: true,
    };
  } catch (error: any) {
    set.status = 500;
    return { success: false, message: error.message || "Failed to compute Nagarik Credits score" };
  }
};

// ==========================================
// POST: Demo merchant transaction + live re-score
// ==========================================
export const createMerchantTestTransaction = async ({
  params: { id },
  body,
  set,
  user: sessionUser,
}: any) => {
  try {
    if (!ensureAuthorizedScoreAccess(sessionUser, id, set)) {
      return { success: false, message: "Forbidden" };
    }

    const merchantUser = await User.findById(id);
    if (!merchantUser) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    const merchant = await ensureMerchantProfile(merchantUser);
    if (!merchant) {
      set.status = 400;
      return { success: false, message: "Test transactions are only available for merchant users" };
    }

    const amount = Math.max(100, Number(body?.amount ?? 1800));
    const counterparty = await findBestDemoCounterparty(id, amount);

    if (!counterparty) {
      set.status = 400;
      return {
        success: false,
        message: "No verified counterparty with enough balance was found for the demo transaction",
      };
    }

    const transactionRecord = await processTransactionRecord({
      _id: `TXN-${crypto.randomUUID().slice(0, 8)}`,
      transaction_code: `TXN-${Date.now()}`,
      sender_id: counterparty._id,
      receiver_id: id,
      amount,
      transaction_type: body?.transaction_type || "QR_PAYMENT",
      status: "SUCCESS",
      payment_channel: body?.payment_channel || "QR",
      transaction_growth_rate: 0.12,
      remarks: body?.remarks || "Demo merchant transaction for live ML score refresh",
      transaction_time: new Date(),
      created_at: new Date(),
    });

    let updatedScore;
    try {
      updatedScore = await fetchLiveMerchantScore(merchantUser, merchant);
    } catch {
      updatedScore = await fetchRealtimeMerchantScoreFallback(merchantUser, merchant);
    }

    set.status = 201;
    return {
      success: true,
      message: "Demo transaction created and merchant score refreshed successfully",
      transaction: transactionRecord,
      updated_score: updatedScore,
      counterparty: {
        id: counterparty._id,
        name: counterparty.name,
      },
    };
  } catch (error: any) {
    set.status = 500;
    return {
      success: false,
      message: error.message || "Failed to create demo merchant transaction",
    };
  }
};
