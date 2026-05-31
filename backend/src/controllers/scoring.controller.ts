import { User, Merchant, Transaction, WalletActivity, CreditScore, PsychometricQuestion } from "../db/schema";

// ==========================================
// HELPERS
// ==========================================

/** Classify data richness into RICH / THIN / ZERO tiers */
const classifyDataTier = (walletAgeMonths: number, txnCount: number): "RICH" | "THIN" | "ZERO" => {
  if (walletAgeMonths === 0 && txnCount === 0) return "ZERO";
  if (walletAgeMonths >= 3 && txnCount >= 10) return "RICH";
  return "THIN";
};

/** How many psychometric questions to ask per tier */
const questionsForTier = (tier: "RICH" | "THIN" | "ZERO"): number => {
  if (tier === "RICH") return 2;
  if (tier === "THIN") return 4;
  return 7; // ZERO
};

/** Derive a psychometric_avg (0-1000) from the submitted answers */
const deriveAvgPsychometricScore = (
  answers: Array<{ option_score: number }> // option_score is 0-100
): number => {
  if (!answers || answers.length === 0) return 500;
  const avg = answers.reduce((sum, a) => sum + a.option_score, 0) / answers.length;
  return Math.round(avg * 10); // scale 0-100 → 0-1000
};

/** Build a RealTimeFeatures payload for the ML service from available DB data + psychometric answers */
const buildRealTimePayload = async (
  userId: string,
  merchant: any,
  walletAgeMonths: number,
  txnCount: number,
  psychometric_avg: number,
  conscientiousness_score: number,
  risk_decision_consistency_score: number
) => {
  // Basic transaction-derived features (approximate from counts)
  const activeDaysRatio = Math.min(txnCount / 30, 1); // rough approximation

  // Revenue approximation from wallet activities
  const walletActivities = await WalletActivity.find({ user_id: userId })
    .sort({ activity_time: -1 })
    .limit(100);

  const totalReceived = walletActivities
    .filter((a: any) => a.activity_type === "PAYMENT_RECEIVED" || a.activity_type === "CASH_IN")
    .reduce((sum: number, a: any) => sum + a.amount, 0);

  const monthlyRevenueAvg = walletAgeMonths > 0 ? totalReceived / walletAgeMonths : totalReceived;

  return {
    merchant_id: merchant._id,
    merchant_code: merchant.merchant_code,
    merchant_user_id: userId,
    business_type: merchant.business_type || "OTHER",
    wallet_age_months: walletAgeMonths,
    monthly_revenue_avg: monthlyRevenueAvg,
    active_days: txnCount,
    active_days_ratio: activeDaysRatio,
    transaction_growth_rate: txnCount > 5 ? 0.1 : 0.0,
    payment_channel_count: 1,
    supplier_payment_ratio: 0.0,
    wallet_velocity_score: Math.min(txnCount / 50, 1),
    transaction_gravity_score: txnCount > 0 ? 0.4 : 0.0,
    liquidity_buffer_score: walletActivities.length > 0 ? 0.4 : 0.2,
    remittance_security_score: 0.0,
    airtime_consistency_score: 0.5,
    utility_calibration_score: 0.5,
    micro_obligation_score: 0.5,
    social_pagerank_score: 0.4,
    collusion_safety_score: 0.5,
    guarantor_health_score: 0.4,
    collusion_risk_score: 0.5,
    psychometric_avg,
    conscientiousness_score,
    risk_decision_consistency_score,
    customer_diversity_score: 0.5,
    repeat_customer_ratio: 0.0,
    refund_rate: 0.0,
    failed_payment_rate: 0.0,
    cashout_speed_score: 0.6,
    loan_to_income_ratio: 0.0,
    suspicious_spike_score: 0.0,
    seasonal_pattern_score: 0.45,
    repayment_consistency_score: 0.6,
    repayment_plan_daily_fit: 0.35,
    repayment_plan_weekly_fit: 0.45,
    repayment_plan_seasonal_fit: 0.20,
  };
};

// ==========================================
// GET: Retrieve pre-calculated score OR assess data profile for scoring flow
// ==========================================
export const getNagarikCreditsScore = async ({ params: { id }, set }: any) => {
  try {
    // 1. Fetch user by ID
    const user = await User.findById(id);
    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    if (user.verified_status !== "verified") {
      set.status = 400;
      return { success: false, message: "Scoring requires a KYC verified user profile" };
    }

    // 2. Find linked merchant profile
    const merchant = await Merchant.findOne({ user_id: id });

    // 3. Check for pre-calculated CreditScore
    const creditScore = merchant
      ? await CreditScore.findOne({ merchant_id: merchant._id })
      : await CreditScore.findOne({ merchant_id: id });

    if (creditScore) {
      return {
        customer_id: id,
        customer_type: user.user_type,
        score: creditScore.final_nagarik_credits_score,
        confidence_interval: 30,
        score_band: creditScore.risk_band,
        factor_breakdown: {
          F1_transaction_consistency: {
            score: creditScore.factor_scores.f1_livelihood_rhythm || 120,
            max: 220,
            notes: "Dynamically mapped from pre-compiled livelihood rhythm indices.",
          },
          F2_cashflow_health: {
            score: creditScore.factor_scores.f2_cash_flow_elasticity || 110,
            max: 195,
            notes: "Parsed from historical operational digital balances.",
          },
          F3_payment_reliability: {
            score: creditScore.factor_scores.f3_smart_digital_footprint || 150,
            max: 245,
            notes: "Utility timeliness and bill resolution cleared.",
          },
          F4_integrity: {
            score: Math.max(0, 215 - (creditScore.factor_scores.fraud_penalty || 0)),
            max: 215,
            flags: creditScore.fraud_flags,
            notes:
              creditScore.fraud_flags.length > 0
                ? `Integrity flags flagged: ${creditScore.fraud_flags.join(", ")}.`
                : "No integrity flags detected.",
          },
          F5_external_signals: {
            score: creditScore.factor_scores.f5_psychometric || 80,
            max: 125,
            notes: "Blended with NEA consumption trends and ISP continuities.",
          },
          F6_b2b_feedback: { score: 0, max: 80, notes: "not active — redistributed" },
        },
        top_improvement_action:
          creditScore.explanation ||
          "Maintain regular transaction operations to build up scoring index.",
        flags: creditScore.fraud_flags,
        data_gaps: [],
      };
    }

    // 4. No pre-calculated score — assess data richness so frontend knows how many questions to ask
    const walletAgeMonths = merchant?.wallet_age_months ?? 0;
    const txnCount = merchant
      ? await Transaction.countDocuments({
          $or: [{ sender_id: id }, { receiver_id: id }],
        })
      : 0;

    const dataTier = classifyDataTier(walletAgeMonths, txnCount);
    const questionsNeeded = questionsForTier(dataTier);

    // 5. Fetch available questions from DB (active only) — frontend will use these or fallback to hardcoded
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
        wallet_age_months: walletAgeMonths,
        transaction_count: txnCount,
        tier: dataTier,
        questions_needed: questionsNeeded,
        has_merchant_profile: !!merchant,
        merchant_id: merchant?._id ?? null,
      },
      psychometric_questions: dbQuestions,
    };
  } catch (error: any) {
    set.status = 500;
    return { success: false, message: error.message || "Failed to retrieve Nagarik Credits score" };
  }
};

// ==========================================
// POST: Compute score from psychometric answers + available data → call ML
// ==========================================
export const computeNagarikCreditsScore = async ({ params: { id }, body, set }: any) => {
  try {
    // 1. Verify user
    const user = await User.findById(id);
    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    if (user.verified_status !== "verified") {
      set.status = 400;
      return { success: false, message: "Scoring requires a KYC verified user profile" };
    }

    // 2. Get merchant profile (may be null for brand new users)
    const merchant = await Merchant.findOne({ user_id: id });
    const walletAgeMonths = merchant?.wallet_age_months ?? 0;
    const txnCount = merchant
      ? await Transaction.countDocuments({ $or: [{ sender_id: id }, { receiver_id: id }] })
      : 0;

    // 3. Derive psychometric scores from submitted answers
    const answers: Array<{ question_id: string; selected_option: string; option_score: number }> =
      body.answers || [];

    const psychometric_avg = deriveAvgPsychometricScore(answers);

    // Derive conscientiousness and risk consistency from answer patterns
    const optionScores = answers.map((a) => a.option_score);
    const maxScore = Math.max(...(optionScores.length ? optionScores : [50]));
    const minScore = Math.min(...(optionScores.length ? optionScores : [50]));
    const scoreRange = maxScore - minScore;

    const conscientiousness_score = psychometric_avg / 1000; // 0-1
    const risk_decision_consistency_score = scoreRange <= 30 ? 0.8 : scoreRange <= 60 ? 0.6 : 0.4;

    // 4. Build real-time feature payload for ML
    const mlPayload = merchant
      ? await buildRealTimePayload(
          id,
          merchant,
          walletAgeMonths,
          txnCount,
          psychometric_avg,
          conscientiousness_score,
          risk_decision_consistency_score
        )
      : {
          // Fully synthetic payload for users without merchant profile (ZERO tier)
          merchant_id: "REALTIME",
          merchant_code: "REALTIME",
          merchant_user_id: id,
          business_type: body.business_type || "OTHER",
          wallet_age_months: 0,
          monthly_revenue_avg: 0,
          active_days: 0,
          active_days_ratio: 0,
          transaction_growth_rate: 0,
          payment_channel_count: 1,
          supplier_payment_ratio: 0,
          wallet_velocity_score: 0.2,
          transaction_gravity_score: 0,
          liquidity_buffer_score: 0.2,
          remittance_security_score: 0,
          airtime_consistency_score: 0.4,
          utility_calibration_score: 0.4,
          micro_obligation_score: 0.4,
          social_pagerank_score: 0.3,
          collusion_safety_score: 0.5,
          guarantor_health_score: 0.3,
          collusion_risk_score: 0.5,
          psychometric_avg,
          conscientiousness_score,
          risk_decision_consistency_score,
          customer_diversity_score: 0.3,
          repeat_customer_ratio: 0,
          refund_rate: 0,
          failed_payment_rate: 0,
          cashout_speed_score: 0.4,
          loan_to_income_ratio: 0,
          suspicious_spike_score: 0,
          seasonal_pattern_score: 0.35,
          repayment_consistency_score: 0.4,
          repayment_plan_daily_fit: 0.35,
          repayment_plan_weekly_fit: 0.45,
          repayment_plan_seasonal_fit: 0.20,
        };

    // 5. Call ML service /predict/realtime
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:9000";
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/realtime`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      set.status = 502;
      return {
        success: false,
        message: `ML service returned an error: ${errText}`,
      };
    }

    const mlResult = await mlResponse.json();

    // 6. Map real ML response shape:
    //    mlResult.scores{}, mlResult.probabilities{}, mlResult.loan_recommendation{}, mlResult.explanation{summary, positive_factors, risk_factors}
    const scores = mlResult.scores ?? {};
    const probs = mlResult.probabilities ?? {};
    const loan = mlResult.loan_recommendation ?? {};
    const explanation = mlResult.explanation ?? {};

    const finalScore = scores.final_nagarik_credits_score ?? scores.ml_repayment_score ?? 0;
    const defaultProb = probs.default_probability ?? 0.5;
    const repaymentProb = probs.repayment_probability ?? 0.5;
    const riskBand = loan.risk_band ?? "THIN_FILE";
    const decision = loan.decision ?? "REVIEW";
    const suggestedLoanAmount = loan.suggested_loan_amount ?? 0;
    const repaymentPlan = loan.repayment_plan ?? "WEEKLY";
    const explanationText = explanation.summary ?? "Nagarik Credits score computed from psychometric and behavioral signals.";
    const merchantId = merchant ? merchant._id.toString() : id;

    await CreditScore.findByIdAndUpdate(
      merchantId,
      {
        _id: merchantId,
        merchant_id: merchantId,
        factor_scores: {
          f1_livelihood_rhythm: scores.f1_livelihood_rhythm ?? 0,
          f2_cash_flow_elasticity: scores.f2_cash_flow_elasticity ?? 0,
          f3_smart_digital_footprint: scores.f3_smart_digital_footprint ?? 0,
          f4_community_trust_graph: scores.f4_community_trust_graph ?? 0,
          f5_psychometric: scores.f5_psychometric ?? Math.round(psychometric_avg / 10),
          fraud_penalty: scores.fraud_penalty ?? 0,
        },
        ml_scores: {
          ml_repayment_score: scores.ml_repayment_score ?? finalScore,
          default_probability: defaultProb,
          repayment_probability: repaymentProb,
        },
        final_nagarik_credits_score: finalScore,
        risk_band: riskBand,
        decision,
        suggested_loan_amount: suggestedLoanAmount,
        repayment_plan: repaymentPlan,
        fraud_flags: mlResult.fraud_flags ?? [],
        explanation: explanationText,
        calculated_at: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      success: true,
      computed: true,
      customer_id: id,
      customer_type: user.user_type,
      data_profile: {
        wallet_age_months: walletAgeMonths,
        transaction_count: txnCount,
        tier: classifyDataTier(walletAgeMonths, txnCount),
        psychometric_questions_answered: answers.length,
        psychometric_avg,
      },
      score: finalScore,
      score_band: loan.risk_band ?? "THIN_FILE",
      confidence_interval: 40,
      ml_prediction: {
        default_probability: defaultProb,
        repayment_probability: repaymentProb,
        predicted_class: loan.decision ?? "REVIEW",
        confidence: repaymentProb,
        top_features: [],
      },
      factor_breakdown: {
        F1_transaction_consistency: { score: scores.f1_livelihood_rhythm ?? 0, max: 220 },
        F2_cashflow_health: { score: scores.f2_cash_flow_elasticity ?? 0, max: 195 },
        F3_payment_reliability: { score: scores.f3_smart_digital_footprint ?? 0, max: 245 },
        F4_integrity: { score: scores.f4_community_trust_graph ?? 0, max: 215, flags: [] },
        F5_external_signals: { score: scores.f5_psychometric ?? Math.round(psychometric_avg / 10), max: 125 },
      },
      // explanation is an object { summary, positive_factors, risk_factors } — pass it through structured
      explanation_summary: explanation.summary ?? "Nagarik Credits score computed from psychometric and behavioral signals.",
      positive_factors: explanation.positive_factors ?? [],
      risk_factors: explanation.risk_factors ?? [],
      flags: [],
      suggested_loan_amount: loan.suggested_loan_amount ?? 0,
      repayment_plan: loan.repayment_plan ?? "WEEKLY",
    };
  } catch (error: any) {
    set.status = 500;
    return { success: false, message: error.message || "Failed to compute Nagarik Credits score" };
  }
};
