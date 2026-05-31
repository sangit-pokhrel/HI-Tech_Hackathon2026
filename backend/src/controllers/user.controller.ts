import { User, Merchant, Transaction, UtilityPayment, WalletActivity, LoanApplication, RepaymentRecord, SocialEdge, PsychometricAnswer, MerchantFeature, ModelPrediction, CreditScore } from "../db/schema";

export const createUser = async ({ body, set }: any) => {
  try {
    const newUser = new User(body);
    const savedUser = await newUser.save();
    set.status = 201;
    return {
      success: true,
      message: "User created successfully",
      data: savedUser,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create user",
    };
  }
};

export const getAllUsers = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.user_code) {
      filter.user_code = query.user_code;
    }
    if (query.user_type) {
      filter.user_type = query.user_type;
    }
    if (query.verified_status) {
      filter.verified_status = query.verified_status;
    }

    const total = await User.countDocuments(filter);
    const items = await User.find(filter)
      .sort({ created_at: -1 })
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
      message: error.message || "Failed to retrieve users",
    };
  }
};

export const getUserById = async ({ params: { id }, set }: any) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        message: "User not found",
      };
    }
    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid user ID",
    };
  }
};

export const updateUser = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      set.status = 404;
      return {
        success: false,
        message: "User not found",
      };
    }

    // Cascade wipe all related records if the user's KYC status is changed to unverified
    if (body.verified_status === "unverified") {
      await Transaction.deleteMany({ $or: [{ sender_id: id }, { receiver_id: id }] });
      await UtilityPayment.deleteMany({ sender_id: id });
      await WalletActivity.deleteMany({ user_id: id });

      const merchant = await Merchant.findOne({ user_id: id });
      if (merchant) {
        const merchantId = merchant._id;
        await LoanApplication.deleteMany({ merchant_id: merchantId });
        await RepaymentRecord.deleteMany({ merchant_id: merchantId });
        await SocialEdge.deleteMany({ source_merchant_id: merchantId });
        await PsychometricAnswer.deleteMany({ merchant_id: merchantId });
        await MerchantFeature.deleteMany({ merchant_id: merchantId });
        await ModelPrediction.deleteMany({ merchant_id: merchantId });
        await CreditScore.deleteMany({ merchant_id: merchantId });
      }
    }

    return {
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update user",
    };
  }
};

export const deleteUser = async ({ params: { id }, set }: any) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      set.status = 404;
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete user",
    };
  }
};
