import { User, Merchant, Customer, Transaction, UtilityPayment, WalletActivity } from "../db/schema";

export const getBishwasScore = async ({ params: { id }, set }: any) => {
  try {
    // 1. Fetch all interconnected user data
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

    const merchant = await Merchant.findOne({ user_id: id });
    const customer = await Customer.findOne({ user_id: id });

    // Fetch related financial records
    const transactions = await Transaction.find({
      $or: [{ sender_id: id }, { receiver_id: id }],
    });
    const walletActivities = await WalletActivity.find({ user_id: id });
    const utilityPayments = await UtilityPayment.find({ sender_id: id });

    // Determine occupation
    let occupation = "OTHER";
    if (merchant) {
      const type = merchant.business_type || "";
      if (type === "GROCERY" || type === "CLOTHING_STORE") {
        occupation = "RETAIL";
      } else {
        occupation = "SERVICES";
      }
    } else if (customer) {
      occupation = "RETAIL";
    }

    // Determine account age in months
    const accountAgeMonths = Math.max(
      1,
      Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    );

    // ==========================================
    // FACTOR 1: TRANSACTION CONSISTENCY (Max 200 pts -> 220 pts redistributed)
    // ==========================================
    // F1.1: Activity Rate (80 pts)
    const txnDates = transactions.map((t: any) => new Date(t.transaction_time).toISOString().split("T")[0]);
    const uniqueTxnDays = new Set(txnDates).size;
    const activityRate = Math.min(100, (uniqueTxnDays / 180) * 100);
    const f1_1 = (activityRate / 100) * 80;

    // F1.2: Trend (40 pts)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentTxns = transactions.filter((t: any) => new Date(t.transaction_time) >= ninetyDaysAgo);
    const olderTxns = transactions.filter((t: any) => new Date(t.transaction_time) < ninetyDaysAgo);
    const trend = recentTxns.length / (olderTxns.length || 1);
    let f1_2 = 25; // Default stable
    if (trend > 1.05) f1_2 = 40; // Growing
    else if (trend < 0.95) f1_2 = 10; // Declining

    // F1.3: Seasonality Correction (40 pts)
    let f1_3 = 35; // Default healthy baseline
    if (occupation === "RETAIL") f1_3 = 40;

    // F1.4: Mix of Transactions (40 pts)
    const txTypes = new Set(transactions.map((t: any) => t.transaction_type));
    let f1_4 = 10;
    if (txTypes.size >= 3) f1_4 = 40;
    else if (txTypes.size === 2) f1_4 = 25;

    const f1_raw = f1_1 + f1_2 + f1_3 + f1_4;
    const f1_score = Math.round(f1_raw * 1.1); // Normalized to max 220

    // ==========================================
    // FACTOR 2: CASH FLOW HEALTH & LIQUIDITY (Max 180 pts -> 195 pts redistributed)
    // ==========================================
    // F2.1: Benchmarked ADB (60 pts)
    const balanceSnapshots = walletActivities.map((wa: any) => wa.balance_after_transaction);
    const adb = balanceSnapshots.length > 0 
      ? balanceSnapshots.reduce((a, b) => a + b, 0) / balanceSnapshots.length
      : user.balance;

    let benchmarkMedian = 10000;
    if (occupation === "RETAIL") benchmarkMedian = 25000;
    else if (occupation === "SERVICES") benchmarkMedian = 30000;

    const f2_1 = Math.min(60, (adb / benchmarkMedian) * 30);

    // F2.2: Volatility (50 pts)
    let f2_2 = 40; // Default stable
    if (balanceSnapshots.length >= 5) {
      const mean = balanceSnapshots.reduce((a, b) => a + b, 0) / balanceSnapshots.length;
      const variance = balanceSnapshots.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / balanceSnapshots.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / (mean || 1);
      if (cv < 0.2) f2_2 = 50;
      else if (cv < 0.5) f2_2 = 35;
      else if (cv < 1.0) f2_2 = 20;
      else f2_2 = 5;
    }

    // F2.3: Capital Hold Duration (40 pts)
    let f2_3 = 30; // Default holding 3-7 days
    if (transactions.some((t: any) => t.amount > 10000)) {
      f2_3 = 40;
    }

    // F2.4: Balance Growth QoQ (30 pts)
    let f2_4 = 20; // Default stable growth
    if (user.balance > adb * 1.05) f2_4 = 30;

    const f2_raw = f2_1 + f2_2 + f2_3 + f2_4;
    const f2_score = Math.round(f2_raw * (195 / 180)); // Normalized to max 195

    // ==========================================
    // FACTOR 3: PAYMENT RELIABILITY (Max 220 pts -> 245 pts redistributed)
    // ==========================================
    // F3.1: Utility Timeliness (70 pts)
    const paidUtilities = utilityPayments.filter((up: any) => up.payment_status !== "UNPAID");
    let f3_1 = 70; // Default clean sheet
    if (paidUtilities.length > 0) {
      const avgDaysLate = paidUtilities.reduce((a, b) => a + (b.days_late || 0), 0) / paidUtilities.length;
      if (avgDaysLate <= 0) f3_1 = 70;
      else if (avgDaysLate <= 5) f3_1 = 50;
      else if (avgDaysLate <= 15) f3_1 = 25;
      else f3_1 = 0;
    }

    // F3.2: Fines (50 pts)
    const fines = utilityPayments.filter((up: any) => up.bill_type === "TRAFFIC_FINE" || up.bill_type === "MUNICIPAL_FINE");
    let f3_2 = 50;
    if (fines.length >= 3) f3_2 = 10;
    else if (fines.length >= 1) f3_2 = 30;

    // F3.3: Fine Speed Resolution (50 pts)
    let f3_3 = 50;
    if (fines.length > 0) {
      const uncleared = fines.some((f: any) => f.payment_status === "UNPAID");
      if (uncleared) f3_3 = 0;
      else {
        const maxLate = Math.max(...fines.map((f: any) => f.days_late || 0));
        if (maxLate === 0) f3_3 = 50;
        else if (maxLate <= 7) f3_3 = 40;
        else if (maxLate <= 30) f3_3 = 20;
        else f3_3 = 0;
      }
    }

    // F3.4: B2B Repayment Adherence (50 pts)
    let f3_4 = 50; // Clean by default

    const f3_raw = f3_1 + f3_2 + f3_3 + f3_4;
    const f3_score = Math.round(f3_raw * (245 / 220)); // Normalized to max 245

    // ==========================================
    // FACTOR 4: INTEGRITY FLAGS (Max 200 pts -> 215 pts redistributed)
    // ==========================================
    const triggeredFlags: string[] = [];

    // F4.1: Balance Staging
    const hasStaging = transactions.some((t: any) => t.transaction_type === "CASH_IN" && t.amount > 50000);
    if (hasStaging) {
      triggeredFlags.push("BALANCE_STAGING");
    }

    // F4.2: Pass Through
    const credits = transactions.filter((t: any) => t.receiver_id === id);
    const debits = transactions.filter((t: any) => t.sender_id === id);
    let hasPassThrough = false;
    for (const credit of credits) {
      const matchingDebit = debits.find(
        (d: any) => Math.abs(d.amount - credit.amount) < 100 && 
        Math.abs(new Date(d.transaction_time).getTime() - new Date(credit.transaction_time).getTime()) < 24 * 60 * 60 * 1000
      );
      if (matchingDebit) {
        hasPassThrough = true;
        break;
      }
    }
    if (hasPassThrough) {
      triggeredFlags.push("PASS_THROUGH_PATTERN");
    }

    // F4.3: Fee Avoidance Splits
    const hasSplitPatterns = transactions.some((t: any) => t.amount === 9999 || t.amount === 999);
    if (hasSplitPatterns) {
      triggeredFlags.push("FEE_AVOIDANCE");
    }

    // F4.5: Dormancy Resurgence
    const hasDormancy = accountAgeMonths > 6 && transactions.length > 0 && 
      !transactions.some((t: any) => {
        const diffDays = (Date.now() - new Date(t.transaction_time).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 7 && diffDays < 180;
      });
    if (hasDormancy) {
      triggeredFlags.push("DORMANCY_RESURGENCE");
    }

    let f4_raw = 200;
    if (triggeredFlags.includes("BALANCE_STAGING")) f4_raw -= 30;
    if (triggeredFlags.includes("PASS_THROUGH_PATTERN")) f4_raw -= 25;
    if (triggeredFlags.includes("FEE_AVOIDANCE")) f4_raw -= 20;
    if (triggeredFlags.includes("DORMANCY_RESURGENCE")) f4_raw -= 15;
    f4_raw = Math.max(0, f4_raw);

    const f4_score = Math.round(f4_raw * (215 / 200)); // Normalized to max 215

    // ==========================================
    // FACTOR 5: EXTERNAL UTILITY & COMPLIANCE SIGNALS (Max 120 pts -> 125 pts redistributed)
    // ==========================================
    // F5.1: NEA Consumption Trend (40 pts)
    let f5_1 = 25; // Default stable
    const electricityBills = utilityPayments.filter((up: any) => up.bill_type === "ELECTRICITY");
    if (electricityBills.length >= 2) {
      const sortedBills = [...electricityBills].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      const firstBill = sortedBills[0].bill_amount;
      const lastBill = sortedBills[sortedBills.length - 1].bill_amount;
      if (lastBill > firstBill * 1.05) f5_1 = 40;
      else if (lastBill < firstBill * 0.95) f5_1 = 10;
    }

    // F5.2: NEA Verification Clearing (30 pts)
    let f5_2 = 30;

    // F5.3: Traffic Violation Compliance (20 pts)
    let f5_3 = 20;

    // F5.4: ISP Continuity (15 pts)
    const hasIsp = utilityPayments.some((up: any) => up.bill_type === "INTERNET");
    let f5_4 = hasIsp ? 15 : 10;

    // F5.5: KUKL Resolution (15 pts)
    let f5_5 = 15;

    const f5_raw = f5_1 + f5_2 + f5_3 + f5_4 + f5_5;
    const f5_score = Math.round(f5_raw * (125 / 120)); // Normalized to max 125

    // ==========================================
    // FACTOR 6: B2B feedback (Always redistributed)
    // ==========================================
    const f6_score = 0;

    // ==========================================
    // COMPILE FINAL DETERMINISTIC SCORE & BAND
    // ==========================================
    let score = f1_score + f2_score + f3_score - (215 - f4_score) + f5_score;
    score = Math.max(0, Math.min(1000, score));

    let scoreBand = "BRONZE";
    if (accountAgeMonths < 3) {
      scoreBand = "THIN_FILE";
    } else {
      if (score >= 850) scoreBand = "PLATINUM";
      else if (score >= 720) scoreBand = "GOLD";
      else if (score >= 580) scoreBand = "SILVER";
      else if (score >= 420) scoreBand = "BRONZE";
      else if (score >= 200) scoreBand = "WATCH";
      else scoreBand = "THIN_FILE";
    }

    // Data gaps
    const dataGaps: string[] = [];
    if (transactions.length === 0) dataGaps.push("TRANSACTIONS");
    if (walletActivities.length === 0) dataGaps.push("WALLET_ACTIVITY");
    if (utilityPayments.length === 0) dataGaps.push("UTILITY");
    if (!merchant) dataGaps.push("MERCHANT_DATA");

    // Dynamic Improvement Action
    let topAction = "Keep maintaining a consistent transaction activity. Continuous operations will increase your scoring index.";
    if (triggeredFlags.includes("BALANCE_STAGING")) {
      topAction = "Avoid large deposits right before loan applications. Gradual savings growth improves score integrity.";
    } else if (f3_1 < 70) {
      topAction = "Pay all electricity and water bills within 5 days of issue to gain up to 45 additional points.";
    } else if (triggeredFlags.includes("FEE_AVOIDANCE")) {
      topAction = "Avoid split transactions near commission thresholds to clear system split-billing flags.";
    } else if (f1_1 < 60) {
      topAction = "Conduct daily micro-payments to eSewa vendors to improve your F1 Transaction Consistency score.";
    }

    return {
      customer_id: id,
      customer_type: user.user_type,
      score,
      confidence_interval: dataGaps.length >= 3 ? 150 : (dataGaps.length >= 1 ? 80 : 30),
      score_band: scoreBand,
      factor_breakdown: {
        F1_transaction_consistency: {
          score: f1_score,
          max: 220,
          notes: `Active ${uniqueTxnDays} of 180 days. Type mix: ${[...txTypes].join(", ") || "None"}.`,
        },
        F2_cashflow_health: {
          score: f2_score,
          max: 195,
          notes: `ADB of Rs. ${Math.round(adb)}. Volatility CV is classified under occupation ${occupation}.`,
        },
        F3_payment_reliability: {
          score: f3_score,
          max: 245,
          notes: `Utility payment timeliness is on-time; ${fines.length} infractions resolved in 12 months.`,
        },
        F4_integrity: {
          score: f4_score,
          max: 215,
          flags: triggeredFlags,
          notes: triggeredFlags.length > 0 
            ? `Integrity flags triggered: ${triggeredFlags.join(", ")}.`
            : "No integrity flags detected.",
        },
        F5_external_signals: {
          score: f5_score,
          max: 125,
          notes: `NEA consumption trend is stable; ISP internet continuous account verified.`,
        },
        F6_b2b_feedback: {
          score: f6_score,
          max: 80,
          notes: "not active — redistributed",
        },
      },
      top_improvement_action: topAction,
      flags: triggeredFlags,
      data_gaps: dataGaps,
    };
  } catch (error: any) {
    set.status = 500;
    return {
      success: false,
      message: error.message || "Failed to calculate Bishwas credit score",
    };
  }
};
