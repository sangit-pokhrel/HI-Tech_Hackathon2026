import { PsychometricQuestion, PsychometricAnswer, Merchant, User } from "../db/schema";

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
// PSYCHOMETRIC QUESTION CONTROLLERS
// ==========================================

export const createQuestion = async ({ body, set }: any) => {
  try {
    const newQuestion = new PsychometricQuestion(body);
    const savedQuestion = await newQuestion.save();
    set.status = 201;
    return {
      success: true,
      message: "Psychometric question created successfully",
      data: savedQuestion,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create question",
    };
  }
};

export const getQuestions = async ({ query, set }: any) => {
  try {
    const filter: any = {};
    if (query.trait_measured) {
      filter.trait_measured = query.trait_measured;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === "true";
    }

    const items = await PsychometricQuestion.find(filter).sort({ question_code: 1 });
    return {
      success: true,
      data: items,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to retrieve questions",
    };
  }
};

export const getQuestionById = async ({ params: { id }, set }: any) => {
  try {
    const question = await PsychometricQuestion.findById(id);
    if (!question) {
      set.status = 404;
      return {
        success: false,
        message: "Question not found",
      };
    }
    return {
      success: true,
      data: question,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid question ID",
    };
  }
};

export const updateQuestion = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedQuestion = await PsychometricQuestion.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedQuestion) {
      set.status = 404;
      return {
        success: false,
        message: "Question not found",
      };
    }

    return {
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update question",
    };
  }
};

export const deleteQuestion = async ({ params: { id }, set }: any) => {
  try {
    const deletedQuestion = await PsychometricQuestion.findByIdAndDelete(id);
    if (!deletedQuestion) {
      set.status = 404;
      return {
        success: false,
        message: "Question not found",
      };
    }
    return {
      success: true,
      message: "Question deleted successfully",
      data: deletedQuestion,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete question",
    };
  }
};

// ==========================================
// PSYCHOMETRIC ANSWER CONTROLLERS
// ==========================================

export const createAnswer = async ({ body, set }: any) => {
  try {
    await verifyMerchantKyc(body.merchant_id);

    const newAnswer = new PsychometricAnswer(body);
    const savedAnswer = await newAnswer.save();
    set.status = 201;
    return {
      success: true,
      message: "Psychometric answer recorded successfully",
      data: savedAnswer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to record answer",
    };
  }
};

export const getAnswers = async ({ query, set }: any) => {
  try {
    const limit = Math.min(Math.max(parseInt(query.limit || "50"), 1), 500);
    const page = Math.max(parseInt(query.page || "1"), 1);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.merchant_id) {
      filter.merchant_id = query.merchant_id;
    }
    if (query.question_id) {
      filter.question_id = query.question_id;
    }

    const total = await PsychometricAnswer.countDocuments(filter);
    const items = await PsychometricAnswer.find(filter)
      .sort({ answered_at: -1 })
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
      message: error.message || "Failed to retrieve answers",
    };
  }
};

export const getAnswerById = async ({ params: { id }, set }: any) => {
  try {
    const answer = await PsychometricAnswer.findById(id);
    if (!answer) {
      set.status = 404;
      return {
        success: false,
        message: "Answer record not found",
      };
    }
    return {
      success: true,
      data: answer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid answer ID",
    };
  }
};

export const deleteAnswer = async ({ params: { id }, set }: any) => {
  try {
    const deletedAnswer = await PsychometricAnswer.findByIdAndDelete(id);
    if (!deletedAnswer) {
      set.status = 404;
      return {
        success: false,
        message: "Answer record not found",
      };
    }
    return {
      success: true,
      message: "Answer record deleted successfully",
      data: deletedAnswer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete answer record",
    };
  }
};
