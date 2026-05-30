import { Merchant } from "../db/schema";

export const createMerchant = async ({ body, set }: any) => {
  try {
    const newMerchant = new Merchant(body);
    const savedMerchant = await newMerchant.save();
    set.status = 201;
    return {
      success: true,
      message: "Merchant created successfully",
      data: savedMerchant,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create merchant",
    };
  }
};

export const getAllMerchants = async ({ set }: any) => {
  try {
    const merchants = await Merchant.find().sort({ created_at: -1 });
    return {
      success: true,
      data: merchants,
    };
  } catch (error: any) {
    set.status = 500;
    return {
      success: false,
      message: error.message || "Failed to retrieve merchants",
    };
  }
};

export const getMerchantById = async ({ params: { id }, set }: any) => {
  try {
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      set.status = 404;
      return {
        success: false,
        message: "Merchant not found",
      };
    }
    return {
      success: true,
      data: merchant,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid merchant ID or query",
    };
  }
};

export const updateMerchant = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedMerchant = await Merchant.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMerchant) {
      set.status = 404;
      return {
        success: false,
        message: "Merchant not found",
      };
    }

    return {
      success: true,
      message: "Merchant updated successfully",
      data: updatedMerchant,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update merchant",
    };
  }
};

export const deleteMerchant = async ({ params: { id }, set }: any) => {
  try {
    const deletedMerchant = await Merchant.findByIdAndDelete(id);
    if (!deletedMerchant) {
      set.status = 404;
      return {
        success: false,
        message: "Merchant not found",
      };
    }

    return {
      success: true,
      message: "Merchant deleted successfully",
      data: deletedMerchant,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete merchant",
    };
  }
};
