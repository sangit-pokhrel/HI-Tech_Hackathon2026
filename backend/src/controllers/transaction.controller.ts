import { Transaction } from "../db/schema";

export const getTransactions = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.transaction_type) {
      filter.transaction_type = query.transaction_type;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.sender_code) {
      filter.sender_code = query.sender_code;
    }
    if (query.receiver_code) {
      filter.receiver_code = query.receiver_code;
    }
    if (query.merchant_id) {
      filter.$or = [
        { sender_code: query.merchant_id },
        { receiver_code: query.merchant_id }
      ];
    }
    if (query.minAmount || query.maxAmount) {
      filter.amount = {};
      if (query.minAmount) filter.amount.$gte = parseFloat(query.minAmount);
      if (query.maxAmount) filter.amount.$lte = parseFloat(query.maxAmount);
    }
    if (query.district) {
      filter["location.district"] = query.district;
    }

    const sortBy = query.sortBy || "transaction_time";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const total = await Transaction.countDocuments(filter);
    const items = await Transaction.find(filter)
      .sort(sort)
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
      message: error.message || "Failed to query transactions",
    };
  }
};

export const createTransaction = async ({ body, set }: any) => {
  try {
    const newTransaction = new Transaction(body);
    const savedTransaction = await newTransaction.save();
    set.status = 201;
    return {
      success: true,
      message: "Transaction created successfully",
      data: savedTransaction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create transaction",
    };
  }
};

export const getTransactionById = async ({ params: { id }, set }: any) => {
  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      set.status = 404;
      return {
        success: false,
        message: "Transaction not found",
      };
    }
    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid transaction ID",
    };
  }
};

export const updateTransaction = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTransaction) {
      set.status = 404;
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    return {
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update transaction",
    };
  }
};

export const deleteTransaction = async ({ params: { id }, set }: any) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(id);
    if (!deletedTransaction) {
      set.status = 404;
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    return {
      success: true,
      message: "Transaction deleted successfully",
      data: deletedTransaction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete transaction",
    };
  }
};
