import { CreditScore, Merchant, User } from "../db/schema";

// Helper to check if a merchant is KYC verified
const verifyMerchantKyc = async (merchantId: string) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) {
    throw new Error("Merchant profile not found");
  }
  const user = await User.findById(merchant.user_id);
  if (!user) {
    throw new Error("Parent User profile not found");
  }
  if (user.verified_status !== "verified") {
    throw new Error("Merchant is not KYC verified");
  }
};

export const createCreditScore = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    // Ensure we delete any existing scores for this merchant to maintain the latest score
    await CreditScore.deleteMany({ merchant_id: body.merchant_id });

    const newScore = new CreditScore(body);
    const savedScore = await newScore.save();
    set.status = 201;
    return {
      success: true,
      message: "Credit score record stored successfully",
      data: savedScore,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to store credit score",
    };
  }
};

export const getCreditScores = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.risk_band) {
      filter.risk_band = query.risk_band;
    }
    if (query.decision) {
      filter.decision = query.decision;
    }

    const total = await CreditScore.countDocuments(filter);
    const items = await CreditScore.find(filter)
      .sort({ calculated_at: -1 })
      .skip(skip)
      .limit(limit);

    return {
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: items,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to retrieve credit scores",
    };
  }
};

export const getCreditScoreById = async ({ params: { id }, set }: any) => {
  try {
    const score = await CreditScore.findById(id);
    if (!score) {
      set.status = 404;
      return {
        success: false,
        message: "Credit score record not found",
      };
    }
    return {
      success: true,
      data: score,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid credit score record ID",
    };
  }
};

export const deleteCreditScore = async ({ params: { id }, set }: any) => {
  try {
    const deletedScore = await CreditScore.findByIdAndDelete(id);
    if (!deletedScore) {
      set.status = 404;
      return {
        success: false,
        message: "Credit score record not found",
      };
    }
    return {
      success: true,
      message: "Credit score record deleted successfully",
      data: deletedScore,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete credit score record",
    };
  }
};
