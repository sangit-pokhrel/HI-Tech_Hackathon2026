import { WalletActivity } from "../db/schema";

export const getWalletActivities = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.activity_type) {
      filter.activity_type = query.activity_type;
    }

    const total = await WalletActivity.countDocuments(filter);
    const items = await WalletActivity.find(filter)
      .sort({ activity_time: -1 })
      .skip(skip)
      .limit(limit);

    return {
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: items,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to query wallet activities",
    };
  }
};

export const createWalletActivity = async ({ body, set }: any) => {
  try {
    const newActivity = new WalletActivity(body);
    const savedActivity = await newActivity.save();
    set.status = 201;
    return {
      success: true,
      message: "Wallet activity created successfully",
      data: savedActivity,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create wallet activity",
    };
  }
};

export const getWalletActivityById = async ({ params: { id }, set }: any) => {
  try {
    const activity = await WalletActivity.findById(id);
    if (!activity) {
      set.status = 404;
      return {
        success: false,
        message: "Wallet activity not found",
      };
    }
    return {
      success: true,
      data: activity,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid wallet activity ID",
    };
  }
};

export const updateWalletActivity = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedActivity = await WalletActivity.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedActivity) {
      set.status = 404;
      return {
        success: false,
        message: "Wallet activity not found",
      };
    }

    return {
      success: true,
      message: "Wallet activity updated successfully",
      data: updatedActivity,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update wallet activity",
    };
  }
};

export const deleteWalletActivity = async ({ params: { id }, set }: any) => {
  try {
    const deletedActivity = await WalletActivity.findByIdAndDelete(id);
    if (!deletedActivity) {
      set.status = 404;
      return {
        success: false,
        message: "Wallet activity not found",
      };
    }

    return {
      success: true,
      message: "Wallet activity deleted successfully",
      data: deletedActivity,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete wallet activity",
    };
  }
};
