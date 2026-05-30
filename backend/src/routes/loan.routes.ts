import { Elysia, t } from "elysia";
import * as LoanController from "../controllers/loan.controller";

export const loanRoutes = new Elysia()
  // ==========================================
  // LOAN APPLICATION ROUTES
  // ==========================================
  .post("/api/loan-applications", LoanController.createLoanApplication, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      loan_application_code: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      requested_amount: t.Numeric({ minimum: 1000 }),
      approved_amount: t.Optional(t.Numeric({ minimum: 0 })),
      loan_purpose: t.String(),
      preferred_repayment_type: t.String(),
      application_status: t.Optional(t.String()),
      applied_at: t.Optional(t.Any()),
      decided_at: t.Optional(t.Any()),
    }),
    detail: {
      summary: "Apply for a digital alternative credit loan",
      tags: ["Loans"],
    },
  })
  .get("/api/loan-applications", LoanController.getLoanApplications, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      application_status: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query loan applications",
      tags: ["Loans"],
    },
  })
  .get("/api/loan-applications/:id", LoanController.getLoanApplicationById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get loan application by ID",
      tags: ["Loans"],
    },
  })
  .put("/api/loan-applications/:id", LoanController.updateLoanApplication, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      merchant_id: t.Optional(t.String()),
      requested_amount: t.Optional(t.Numeric()),
      approved_amount: t.Optional(t.Numeric()),
      loan_purpose: t.Optional(t.String()),
      preferred_repayment_type: t.Optional(t.String()),
      application_status: t.Optional(t.String()),
      decided_at: t.Optional(t.Any()),
    }),
    detail: {
      summary: "Update loan application details/decision",
      tags: ["Loans"],
    },
  })
  .delete("/api/loan-applications/:id", LoanController.deleteLoanApplication, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete loan application by ID",
      tags: ["Loans"],
    },
  })

  // ==========================================
  // REPAYMENT RECORD ROUTES
  // ==========================================
  .post("/api/repayment-records", LoanController.createRepaymentRecord, {
    body: t.Object({
      _id: t.String({ minLength: 1 }),
      repayment_code: t.String({ minLength: 1 }),
      loan_application_id: t.String({ minLength: 1 }),
      merchant_id: t.String({ minLength: 1 }),
      due_amount: t.Numeric({ minimum: 0 }),
      paid_amount: t.Optional(t.Numeric({ minimum: 0 })),
      due_date: t.Any(),
      paid_date: t.Optional(t.Any()),
      repayment_status: t.Optional(t.String()),
      days_late: t.Optional(t.Numeric({ minimum: 0 })),
      ml_target_default: t.Optional(t.Numeric()),
    }),
    detail: {
      summary: "Create a repayment record for tracking",
      tags: ["Repayments"],
    },
  })
  .get("/api/repayment-records", LoanController.getRepaymentRecords, {
    query: t.Object({
      limit: t.Optional(t.String()),
      page: t.Optional(t.String()),
      merchant_id: t.Optional(t.String()),
      loan_application_id: t.Optional(t.String()),
      repayment_status: t.Optional(t.String()),
    }),
    detail: {
      summary: "Query repayment records",
      tags: ["Repayments"],
    },
  })
  .get("/api/repayment-records/:id", LoanController.getRepaymentRecordById, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Get repayment record by ID",
      tags: ["Repayments"],
    },
  })
  .put("/api/repayment-records/:id", LoanController.updateRepaymentRecord, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      merchant_id: t.Optional(t.String()),
      due_amount: t.Optional(t.Numeric()),
      paid_amount: t.Optional(t.Numeric()),
      paid_date: t.Optional(t.Any()),
      repayment_status: t.Optional(t.String()),
      days_late: t.Optional(t.Numeric()),
      ml_target_default: t.Optional(t.Numeric()),
    }),
    detail: {
      summary: "Update repayment record by ID",
      tags: ["Repayments"],
    },
  })
  .delete("/api/repayment-records/:id", LoanController.deleteRepaymentRecord, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Delete repayment record by ID",
      tags: ["Repayments"],
    },
  });
