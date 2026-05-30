import { SocialEdge, Merchant, User } from "../db/schema";

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

export const createSocialEdge = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.source_merchant_id);

    const newEdge = new SocialEdge(body);
    const savedEdge = await newEdge.save();
    set.status = 201;
    return {
      success: true,
      message: "Social edge created successfully",
      data: savedEdge,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create social edge",
    };
  }
};

export const getSocialEdges = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "50"), 1), 500);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.source_merchant_id) {
      filter.source_merchant_id = query.source_merchant_id;
    }
    if (query.target_entity_id) {
      filter.target_entity_id = query.target_entity_id;
    }
    if (query.relationship_type) {
      filter.relationship_type = query.relationship_type;
    }

    const total = await SocialEdge.countDocuments(filter);
    const items = await SocialEdge.find(filter)
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
      message: error.message || "Failed to retrieve social edges",
    };
  }
};

export const getSocialEdgeById = async ({ params: { id }, set }: any) => {
  try {
    const edge = await SocialEdge.findById(id);
    if (!edge) {
      set.status = 404;
      return {
        success: false,
        message: "Social edge not found",
      };
    }
    return {
      success: true,
      data: edge,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid social edge ID",
    };
  }
};

export const updateSocialEdge = async ({ params: { id }, body, set }: any) => {
  try {
    if (body.source_merchant_id) {
      await verifyMerchantKyc(body.source_merchant_id);
    }

    const updatedEdge = await SocialEdge.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedEdge) {
      set.status = 404;
      return {
        success: false,
        message: "Social edge not found",
      };
    }

    return {
      success: true,
      message: "Social edge updated successfully",
      data: updatedEdge,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update social edge",
    };
  }
};

export const deleteSocialEdge = async ({ params: { id }, set }: any) => {
  try {
    const deletedEdge = await SocialEdge.findByIdAndDelete(id);
    if (!deletedEdge) {
      set.status = 404;
      return {
        success: false,
        message: "Social edge not found",
      };
    }
    return {
      success: true,
      message: "Social edge deleted successfully",
      data: deletedEdge,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete social edge",
    };
  }
};
