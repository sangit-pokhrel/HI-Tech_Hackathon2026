import { Transaction, User, WalletActivity } from "../db/schema";

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
    if (query.sender_id) {
      filter.sender_id = query.sender_id;
    }
    if (query.receiver_id) {
      filter.receiver_id = query.receiver_id;
    }
    if (query.merchant_id) {
      filter.$or = [
        { sender_id: query.merchant_id },
        { receiver_id: query.merchant_id }
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
    const sender = await User.findById(body.sender_id);
    const receiver = await User.findById(body.receiver_id);

    if (!sender) {
      throw new Error("Sender User profile not found");
    }
    if (!receiver) {
      throw new Error("Receiver User profile not found");
    }

    if (sender.verified_status !== "verified") {
      throw new Error("Sender user is not KYC verified");
    }
    if (receiver.verified_status !== "verified") {
      throw new Error("Receiver user is not KYC verified");
    }

    const amount = parseFloat(body.amount);
    
    // Validate balance for debits (unless cash-in load)
    if (body.transaction_type !== "CASH_IN" && sender.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Process balances on User wallets
    if (body.transaction_type === "CASH_IN") {
      receiver.balance += amount;
      await receiver.save();

      // Log wallet activity for Receiver
      const recAct = new WalletActivity({
        _id: `WAL-${crypto.randomUUID().slice(0, 8)}`,
        user_id: receiver._id,
        activity_type: "CASH_IN",
        amount,
        balance_after_transaction: receiver.balance
      });
      await recAct.save();
    } else {
      // Debit sender, Credit receiver
      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save();
      await receiver.save();

      // Log wallet activity for Sender
      let senderActType = "CASH_OUT";
      if (body.transaction_type === "BILL_PAYMENT") senderActType = "BILL_PAYMENT";
      if (body.transaction_type === "SUPPLIER_PAYMENT") senderActType = "SUPPLIER_PAYMENT";

      const sendAct = new WalletActivity({
        _id: `WAL-${crypto.randomUUID().slice(0, 8)}`,
        user_id: sender._id,
        activity_type: senderActType,
        amount,
        balance_after_transaction: sender.balance
      });
      await sendAct.save();

      // Log wallet activity for Receiver
      let recActType = "PAYMENT_RECEIVED";
      if (body.transaction_type === "REFUND") recActType = "PAYMENT_RECEIVED";

      const recAct = new WalletActivity({
        _id: `WAL-${crypto.randomUUID().slice(0, 8)}`,
        user_id: receiver._id,
        activity_type: recActType,
        amount,
        balance_after_transaction: receiver.balance
      });
      await recAct.save();
    }

    // Save transaction
    const newTransaction = new Transaction(body);
    const savedTransaction = await newTransaction.save();
    
    set.status = 201;
    return {
      success: true,
      message: "Transaction processed and balances synchronized successfully",
      data: savedTransaction,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to process transaction",
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
