import { UtilityPayment, User } from "../db/schema";

export const getUtilityPayments = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.sender_id) {
      filter.sender_id = query.sender_id;
    }
    if (query.bill_type) {
      filter.bill_type = query.bill_type;
    }
    if (query.payment_status) {
      filter.payment_status = query.payment_status;
    }

    const total = await UtilityPayment.countDocuments(filter);
    const items = await UtilityPayment.find(filter)
      .sort({ due_date: -1 })
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
      message: error.message || "Failed to query utility payments",
    };
  }
};

export const createUtilityPayment = async ({ body, set }: any) => {
  try {
    const sender = await User.findById(body.sender_id);
    if (!sender) {
      throw new Error("Sender User profile not found");
    }
    if (sender.verified_status !== "verified") {
      throw new Error("Sender user is not KYC verified");
    }

    const newPayment = new UtilityPayment(body);
    const savedPayment = await newPayment.save();
    set.status = 201;
    return {
      success: true,
      message: "Utility payment created successfully",
      data: savedPayment,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create utility payment",
    };
  }
};

export const getUtilityPaymentById = async ({ params: { id }, set }: any) => {
  try {
    const payment = await UtilityPayment.findById(id);
    if (!payment) {
      set.status = 404;
      return {
        success: false,
        message: "Utility payment not found",
      };
    }
    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid utility payment ID",
    };
  }
};

export const updateUtilityPayment = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedPayment = await UtilityPayment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPayment) {
      set.status = 404;
      return {
        success: false,
        message: "Utility payment not found",
      };
    }

    return {
      success: true,
      message: "Utility payment updated successfully",
      data: updatedPayment,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update utility payment",
    };
  }
};

export const deleteUtilityPayment = async ({ params: { id }, set }: any) => {
  try {
    const deletedPayment = await UtilityPayment.findByIdAndDelete(id);
    if (!deletedPayment) {
      set.status = 404;
      return {
        success: false,
        message: "Utility payment not found",
      };
    }

    return {
      success: true,
      message: "Utility payment deleted successfully",
      data: deletedPayment,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete utility payment",
    };
  }
};
