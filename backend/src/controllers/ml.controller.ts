import { MerchantFeature, ModelPrediction, MLTrainingRun, Merchant, User } from "../db/schema";

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

// ==========================================
// MERCHANT FEATURES CONTROLLERS
// ==========================================

export const createMerchantFeature = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    // Overwrite existing features if already exists (features should be unique per merchant)
    await MerchantFeature.deleteMany({ merchant_id: body.merchant_id });

    const newFeature = new MerchantFeature(body);
    const savedFeature = await newFeature.save();
    set.status = 201;
    return {
      success: true,
      message: "Merchant features created/updated successfully",
      data: savedFeature,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create merchant features",
    };
  }
};

export const getMerchantFeatures = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.repayment_outcome) {
      filter["ml_target.repayment_outcome"] = query.repayment_outcome;
    }

    const total = await MerchantFeature.countDocuments(filter);
    const items = await MerchantFeature.find(filter)
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
      message: error.message || "Failed to retrieve merchant features",
    };
  }
};

export const getMerchantFeatureById = async ({ params: { id }, set }: any) => {
  try {
    const feature = await MerchantFeature.findById(id);
    if (!feature) {
      set.status = 404;
      return {
        success: false,
        message: "Merchant features not found",
      };
    }
    return {
      success: true,
      data: feature,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid features record ID",
    };
  }
};

export const deleteMerchantFeature = async ({ params: { id }, set }: any) => {
  try {
    const deletedFeature = await MerchantFeature.findByIdAndDelete(id);
    if (!deletedFeature) {
      set.status = 404;
      return {
        success: false,
        message: "Merchant features not found",
      };
    }
    return {
      success: true,
      message: "Merchant features deleted successfully",
      data: deletedFeature,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete features record",
    };
  }
};

// ==========================================
// MODEL PREDICTION CONTROLLERS
// ==========================================

export const createModelPrediction = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    const newPrediction = new ModelPrediction(body);
    const savedPrediction = await newPrediction.save();
    set.status = 201;
    return {
      success: true,
      message: "Model prediction saved successfully",
      data: savedPrediction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to save model prediction",
    };
  }
};

export const getModelPredictions = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.predicted_class) {
      filter.predicted_class = query.predicted_class;
    }

    const total = await ModelPrediction.countDocuments(filter);
    const items = await ModelPrediction.find(filter)
      .sort({ predicted_at: -1 })
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
      message: error.message || "Failed to retrieve model predictions",
    };
  }
};

export const getModelPredictionById = async ({ params: { id }, set }: any) => {
  try {
    const prediction = await ModelPrediction.findById(id);
    if (!prediction) {
      set.status = 404;
      return {
        success: false,
        message: "Model prediction not found",
      };
    }
    return {
      success: true,
      data: prediction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid prediction ID",
    };
  }
};

export const deleteModelPrediction = async ({ params: { id }, set }: any) => {
  try {
    const deletedPrediction = await ModelPrediction.findByIdAndDelete(id);
    if (!deletedPrediction) {
      set.status = 404;
      return {
        success: false,
        message: "Model prediction not found",
      };
    }
    return {
      success: true,
      message: "Model prediction deleted successfully",
      data: deletedPrediction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete prediction",
    };
  }
};

// ==========================================
// ML TRAINING RUN CONTROLLERS
// ==========================================

export const createTrainingRun = async ({ body, set }: any) => {
  try {
    const newRun = new MLTrainingRun(body);
    const savedRun = await newRun.save();
    set.status = 201;
    return {
      success: true,
      message: "ML Training run recorded successfully",
      data: savedRun,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to save training run metadata",
    };
  }
};

export const getTrainingRuns = async ({ query, set }: any) => {
  try {
    const items = await MLTrainingRun.find().sort({ trained_at: -1 });
    return {
      success: true,
      data: items,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to retrieve training runs",
    };
  }
};

export const getTrainingRunById = async ({ params: { id }, set }: any) => {
  try {
    const run = await MLTrainingRun.findById(id);
    if (!run) {
      set.status = 404;
      return {
        success: false,
        message: "Training run not found",
      };
    }
    return {
      success: true,
      data: run,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid training run ID",
    };
  }
};

export const deleteTrainingRun = async ({ params: { id }, set }: any) => {
  try {
    const deletedRun = await MLTrainingRun.findByIdAndDelete(id);
    if (!deletedRun) {
      set.status = 404;
      return {
        success: false,
        message: "Training run not found",
      };
    }
    return {
      success: true,
      message: "Training run deleted successfully",
      data: deletedRun,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete training run metadata",
    };
  }
};
