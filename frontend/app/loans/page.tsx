"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  RotateCw, 
  Briefcase, 
  Coins, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function LoansPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const router = useRouter();

  // Merchant lookup and loan fetching
  const [merchantId, setMerchantId] = useState("");
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNoScore, setHasNoScore] = useState(false);

  // Form states for new application
  const [amount, setAmount] = useState("25000");
  const [purpose, setPurpose] = useState("INVENTORY_PURCHASE");
  const [repaymentType, setRepaymentType] = useState("WEEKLY");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  // Fetch Merchant Details dynamically to retrieve the correct MRC ID
  const fetchMerchantAndLoans = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");
    setHasNoScore(false);
    try {
      // Fetch all merchants to find the linked profile
      const merchantRes = await fetch("/api/merchants", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      });
      const merchantData = await merchantRes.json();
      if (!merchantRes.ok) throw new Error("Failed to load merchant registries.");

      const linkedMerchant = (merchantData.data || []).find((m: any) => m.user_id === currentUser.id);
      
      if (!linkedMerchant) {
        throw new Error("No active merchant profile is linked to this account. Micro-loans require an active merchant status.");
      }

      setMerchantId(linkedMerchant._id);

      // Check if they have an active calculated credit score in the database first!
      const scoreRes = await fetch(`/api/users/${currentUser.id}/score`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok && scoreData.error_code === "NO_SCORE_RECORD") {
        setHasNoScore(true);
        setLoading(false);
        return;
      }

      // Now query loan applications with the found merchant _id
      const loanRes = await fetch(`/api/loan-applications?merchant_id=${linkedMerchant._id}&limit=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      });
      const loanData = await loanRes.json();
      if (!loanRes.ok) throw new Error("Failed to load loan histories.");

      setLoans(loanData.data || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading loan details.");
    } finally {
      setLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    fetchMerchantAndLoans();
  }, [fetchMerchantAndLoans]);

  // Submit Loan Application
  const handleApplyForLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) {
      setFormError("Merchant identification is required. Reload profile.");
      return;
    }

    const reqAmt = parseFloat(amount);
    if (isNaN(reqAmt) || reqAmt < 1000) {
      setFormError("Requested amount must be at least Rs. 1,000.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMsg("");

    try {
      const appUuid = crypto.randomUUID().slice(0, 8);
      const loanApplicationData = {
        _id: `LNP-${appUuid}`,
        loan_application_code: `LNC-${appUuid}`,
        merchant_id: merchantId,
        requested_amount: reqAmt,
        approved_amount: 0,
        loan_purpose: purpose,
        preferred_repayment_type: repaymentType,
        application_status: "PENDING"
      };

      const res = await fetch("/api/loan-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify(loanApplicationData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit loan request.");
      }

      setSuccessMsg("Your digital micro-credit request has been lodged successfully! The AI engine will review your transaction consistency in minutes.");
      
      setAmount("25000");
      setPurpose("INVENTORY_PURCHASE");
      setRepaymentType("WEEKLY");

      // Refresh applications list
      fetchMerchantAndLoans();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong while processing your loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "DISBURSED":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold";
      case "PENDING":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold";
      case "REVIEW":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold";
      case "REJECTED":
        return "bg-red-500/10 border-red-500/30 text-red-400 font-bold";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400 font-bold";
    }
  };

  return (
    <DashboardLayout>
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md animate-pulse">
          <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Querying credit pipelines...</span>
        </div>
      ) : hasNoScore ? (
        /* 1. NO SCORE CARD: Renders full width card asking user to evaluate themselves first */
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 max-w-2xl mx-auto my-12 animate-in fade-in zoom-in duration-500">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-35 group-hover:opacity-100 blur transition duration-700" />
          
          <div className="relative p-10 rounded-2xl bg-slate-950/80 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Nagarik Credit Score Required
            </h2>
            <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
              You do not have a Nagarik Credit Score yet. You must generate your behavioral trust index first before applying for micro-credit loans.
            </p>

            <button
              onClick={() => router.push("/credits?redirectReason=no-score")}
              className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/15 cursor-pointer active:scale-95 hover:shadow-blue-500/25"
            >
              Click here to evaluate yourself
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Otherwise show the Form and table history details */
        <>
          {/* BIG FORM AT THE TOP ("Big Thing at First") */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-600/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wider">Apply For Micro-Credit Loan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Request collateral-free liquidity calibration instantly based on alternative scoring indexes</p>
              </div>
            </div>

            {successMsg && (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-6 flex items-start gap-2.5 leading-relaxed">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {formError && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyForLoan} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Input 1: Requested Amount */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-slate-500" /> Requested Amount (Rs.)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all font-bold h-[42px]"
                />
              </div>

              {/* Input 2: Purpose */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Loan Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 transition-all font-bold h-[42px] cursor-pointer"
                >
                  <option value="INVENTORY_PURCHASE">Inventory Purchase</option>
                  <option value="SHOP_EXPANSION">Shop Expansion</option>
                  <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
                  <option value="WORKING_CAPITAL">Working Capital</option>
                  <option value="SEASONAL_STOCK">Seasonal Stock Load</option>
                  <option value="EMERGENCY_BUSINESS_NEED">Emergency Need</option>
                  <option value="OTHER">Other Purposes</option>
                </select>
              </div>

              {/* Input 3: Repayment and Submit Button Group */}
              <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" /> Repayment Cycle
                  </label>
                  <select
                    value={repaymentType}
                    onChange={(e) => setRepaymentType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 transition-all font-bold h-[42px] cursor-pointer"
                  >
                    <option value="DAILY">Daily Repayment</option>
                    <option value="WEEKLY">Weekly Repayment</option>
                    <option value="MONTHLY">Monthly Repayment</option>
                    <option value="SEASONAL">Seasonal Settlement</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !merchantId}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95 h-[42px]"
                >
                  {submitting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* PAST APPLICATIONS TABLE BELOW ("Old Record if there") */}
          {loans.length > 0 ? (
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 py-4 border-b border-slate-900/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Past Micro-Credit Applications
                </h2>
                <button 
                  onClick={fetchMerchantAndLoans} 
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/80 bg-slate-950/40 text-[9px] uppercase tracking-widest font-bold text-slate-500">
                      <th className="px-6 py-4">Application Code</th>
                      <th className="px-6 py-4">Purpose</th>
                      <th className="px-6 py-4">Repayment Cycle</th>
                      <th className="px-6 py-4">Requested</th>
                      <th className="px-6 py-4">Approved Amount</th>
                      <th className="px-6 py-4 text-right">Application Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40 text-xs">
                    {loans.map((ln) => (
                      <tr key={ln._id} className="hover:bg-slate-900/20 transition-all">
                        <td className="px-6 py-4 font-mono font-bold text-slate-300">
                          {ln.loan_application_code}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-semibold text-[11px]">
                          {ln.loan_purpose?.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-semibold text-[11px]">
                          {ln.preferred_repayment_type}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-bold">
                          Rs. {ln.requested_amount.toLocaleString("en-NP")}
                        </td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">
                          {ln.approved_amount > 0 ? `Rs. ${ln.approved_amount.toLocaleString("en-NP")}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${getStatusStyles(ln.application_status)}`}>
                            {ln.application_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
              <p className="text-xs text-slate-500">No active micro-credit applications registered in our databases.</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
