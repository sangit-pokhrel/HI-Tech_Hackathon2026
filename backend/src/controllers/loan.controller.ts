import { LoanApplication, RepaymentRecord, Merchant, User } from "../db/schema";

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
// LOAN APPLICATION CONTROLLERS
// ==========================================

export const createLoanApplication = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    const newLoan = new LoanApplication(body);
    const savedLoan = await newLoan.save();
    set.status = 201;
    return {
      success: true,
      message: "Loan application created successfully",
      data: savedLoan,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create loan application",
    };
  }
};

export const getLoanApplications = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.application_status) {
      filter.application_status = query.application_status;
    }

    const total = await LoanApplication.countDocuments(filter);
    const items = await LoanApplication.find(filter)
      .sort({ applied_at: -1 })
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
      message: error.message || "Failed to retrieve loan applications",
    };
  }
};

export const getLoanApplicationById = async ({ params: { id }, set }: any) => {
  try {
    const loan = await LoanApplication.findById(id);
    if (!loan) {
      set.status = 404;
      return {
        success: false,
        message: "Loan application not found",
      };
    }
    return {
      success: true,
      data: loan,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid loan application ID",
    };
  }
};

export const updateLoanApplication = async ({ params: { id }, body, set }: any) => {
  try {
    if (body.merchant_id) {
      await verifyMerchantKyc(body.merchant_id);
    }

    const updatedLoan = await LoanApplication.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLoan) {
      set.status = 404;
      return {
        success: false,
        message: "Loan application not found",
      };
    }

    return {
      success: true,
      message: "Loan application updated successfully",
      data: updatedLoan,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update loan application",
    };
  }
};

export const deleteLoanApplication = async ({ params: { id }, set }: any) => {
  try {
    const deletedLoan = await LoanApplication.findByIdAndDelete(id);
    if (!deletedLoan) {
      set.status = 404;
      return {
        success: false,
        message: "Loan application not found",
      };
    }
    return {
      success: true,
      message: "Loan application deleted successfully",
      data: deletedLoan,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete loan application",
    };
  }
};

// ==========================================
// REPAYMENT RECORD CONTROLLERS
// ==========================================

export const createRepaymentRecord = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    const newRecord = new RepaymentRecord(body);
    const savedRecord = await newRecord.save();
    set.status = 201;
    return {
      success: true,
      message: "Repayment record created successfully",
      data: savedRecord,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create repayment record",
    };
  }
};

export const getRepaymentRecords = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.loan_application_id) {
      filter.loan_application_id = query.loan_application_id;
    }
    if (query.repayment_status) {
      filter.repayment_status = query.repayment_status;
    }

    const total = await RepaymentRecord.countDocuments(filter);
    const items = await RepaymentRecord.find(filter)
      .sort({ due_date: -1 })
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
      message: error.message || "Failed to retrieve repayment records",
    };
  }
};

export const getRepaymentRecordById = async ({ params: { id }, set }: any) => {
  try {
    const record = await RepaymentRecord.findById(id);
    if (!record) {
      set.status = 404;
      return {
        success: false,
        message: "Repayment record not found",
      };
    }
    return {
      success: true,
      data: record,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid repayment record ID",
    };
  }
};

export const updateRepaymentRecord = async ({ params: { id }, body, set }: any) => {
  try {
    if (body.merchant_id) {
      await verifyMerchantKyc(body.merchant_id);
    }

    const updatedRecord = await RepaymentRecord.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRecord) {
      set.status = 404;
      return {
        success: false,
        message: "Repayment record not found",
      };
    }

    return {
      success: true,
      message: "Repayment record updated successfully",
      data: updatedRecord,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update repayment record",
    };
  }
};

export const deleteRepaymentRecord = async ({ params: { id }, set }: any) => {
  try {
    const deletedRecord = await RepaymentRecord.findByIdAndDelete(id);
    if (!deletedRecord) {
      set.status = 404;
      return {
        success: false,
        message: "Repayment record not found",
      };
    }
    return {
      success: true,
      message: "Repayment record deleted successfully",
      data: deletedRecord,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete repayment record",
    };
  }
};
