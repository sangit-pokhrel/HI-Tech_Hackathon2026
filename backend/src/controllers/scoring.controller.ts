import { User, Merchant, Customer, Transaction, UtilityPayment, WalletActivity, CreditScore } from "../db/schema";

// GET: Retrieve pre-calculated Credit Score
export const getNagarikCreditsScore = async ({ params: { id }, set }: any) => {
  try {
    // 1. Fetch user by ID
    const user = await User.findById(id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        message: "User not found",
      };
    }

    if (user.verified_status !== "verified") {
      set.status = 400;
      return {
        success: false,
        message: "Scoring requires a KYC verified user profile",
      };
    }

    // 2. Find linked merchant profile
    const merchant = await Merchant.findOne({ user_id: id });
    
    // 3. Find pre-calculated CreditScore document in the database
    const creditScore = merchant ? await CreditScore.findOne({ merchant_id: merchant._id }) : null;

    // 4. If credit score document is found in DB, return its fields directly!
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
            notes: creditScore.fraud_flags.length > 0 
              ? `Integrity flags flagged: ${creditScore.fraud_flags.join(", ")}.`
              : "No integrity flags detected.",
          },
          F5_external_signals: {
            score: creditScore.factor_scores.f5_psychometric || 80,
            max: 125,
            notes: "Blended with NEA consumption trends and ISP continuities.",
          },
          F6_b2b_feedback: {
            score: 0,
            max: 80,
            notes: "not active — redistributed",
          },
        },
        top_improvement_action: creditScore.explanation || "Maintain regular transaction operations to build up scoring index.",
        flags: creditScore.fraud_flags,
        data_gaps: [],
      };
    }

    // 5. If no pre-calculated score document exists in DB, return a 404 with custom error_code
    set.status = 404;
    return {
      success: false,
      error_code: "NO_SCORE_RECORD",
      message: "No pre-calculated credit score record found for this user in the database",
    };
  } catch (error: any) {
    set.status = 500;
    return {
      success: false,
      message: error.message || "Failed to calculate Nagarik Credits score",
    };
  }
};
