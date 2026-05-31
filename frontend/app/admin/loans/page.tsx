"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  AlertTriangle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Coins,
  Sparkles,
  Award
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";

export default function AdminLoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loanTab, setLoanTab] = useState<"pending" | "all">("pending");
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchLoans = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const loansRes = await fetch(`${backendUrl}/loan-applications?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const loansData = await loansRes.json();

      if (loansRes.ok && loansData.success) {
        setLoans(loansData.data || []);
      } else {
        throw new Error(loansData.message || "Failed to fetch loan applications.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrative loans pipeline.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchLoans();
    }
  }, [status, currentUser, fetchLoans]);

  // Underwrite Merchant Loan
  const handleUnderwriteLoan = async (loanId: string, merchantId: string, targetStatus: "APPROVED" | "REJECTED", requestedAmount: number) => {
    setActionLoading(loanId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/loan-applications/${loanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          application_status: targetStatus,
          approved_amount: targetStatus === "APPROVED" ? requestedAmount : 0,
          decided_at: new Date()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to underwrite loan");
      }

      setLoans(prev => prev.map(l => l._id === loanId ? { ...l, application_status: targetStatus, approved_amount: targetStatus === "APPROVED" ? requestedAmount : 0 } : l));
    } catch (err: any) {
      alert(err.message || "Failed to update loan application.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLoans = loans.filter(l => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = l._id.toLowerCase().includes(term) || l.merchant_id.toLowerCase().includes(term) || l.loan_purpose.toLowerCase().includes(term);
    const matchesTab = loanTab === "pending" ? l.application_status === "PENDING" : true;
    return matchesSearch && matchesTab;
  });

  const getMockCreditFactors = (merchantId: string) => {
    const hash = merchantId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const baseScore = 300 + (hash % 500);
    const riskBand = baseScore > 720 ? "PLATINUM" : baseScore > 640 ? "GOLD" : baseScore > 540 ? "SILVER" : baseScore > 400 ? "BRONZE" : "WATCH";
    return {
      score: baseScore,
      riskBand,
      factors: {
        f1: 100 + (hash % 100),
        f2: 90 + (hash % 90),
        f3: 110 + (hash % 110),
        f4: 80 + (hash % 120),
        f5: 120 + (hash % 80)
      }
    };
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Nagarik Alternative Underwritings</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Loans Underwriting Pipeline
                <Briefcase className="w-5 h-5 text-indigo-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Underwrite micro-merchant loan applications, analyze alternate F1-F5 credit score factors, and approve disbursed capitals.
              </p>
            </div>

            <button
              onClick={fetchLoans}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Loans
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Controls & Search */}
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants, loan purpose keys..."
            className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all w-full sm:max-w-xs"
          />

          <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
            <button 
              onClick={() => setLoanTab("pending")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${loanTab === "pending" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              Awaiting Review ({loans.filter(l => l.application_status === "PENDING").length})
            </button>
            <button 
              onClick={() => setLoanTab("all")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${loanTab === "all" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              All Loans Ledger
            </button>
          </div>
        </div>

        {/* Loans list */}
        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Resolving loan pipelines...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
            No loan applications found matching filters
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const isExpanded = expandedLoan === loan._id;
              const scoreContext = getMockCreditFactors(loan.merchant_id);

              return (
                <div 
                  key={loan._id}
                  className={`rounded-xl border transition-all ${
                    isExpanded 
                      ? "border-indigo-500/40 bg-slate-950/50 shadow-lg shadow-indigo-500/5" 
                      : "border-slate-900 bg-slate-950/20 hover:border-slate-800"
                  }`}
                >
                  <div 
                    onClick={() => setExpandedLoan(isExpanded ? null : loan._id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none font-semibold"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-200">NPR {loan.requested_amount?.toLocaleString()}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          loan.application_status === "APPROVED"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : loan.application_status === "REJECTED"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                        }`}>
                          {loan.application_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{loan._id} · {loan.loan_purpose.replace("_", " ")}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nagarik Score</p>
                        <p className="text-xs font-extrabold text-blue-400">{scoreContext.score}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-900/60 space-y-4 text-xs animate-in fade-in duration-300 font-semibold">
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-3 rounded-lg border border-slate-900/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Merchant profile ID</span>
                          <span className="font-bold text-slate-300 font-mono">{loan.merchant_id}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Repayment cycle</span>
                          <span className="font-bold text-slate-300">{loan.preferred_repayment_type}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Applied Date</span>
                          <span className="font-bold text-slate-300">{new Date(loan.applied_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Approved Capital</span>
                          <span className="font-bold text-emerald-400">NPR {loan.approved_amount?.toLocaleString() || "0"}</span>
                        </div>
                      </div>

                      {/* Alternate credit score indicators */}
                      <div className="space-y-2.5 p-3 rounded-xl border border-blue-500/20 bg-blue-600/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-blue-500/20"><Sparkles className="w-12 h-12" /></div>
                        <div className="flex items-center justify-between border-b border-blue-500/20 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-blue-400" />
                            Nagarik Alternative Credit Underwriting
                          </span>
                          <span className="text-[10px] font-bold text-blue-400">{scoreContext.riskBand} Risk Category</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
                          <div className="p-2 rounded bg-slate-950/40 border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">F1 rhythm</span>
                            <span className="font-extrabold text-blue-400">{scoreContext.factors.f1}/200</span>
                          </div>
                          <div className="p-2 rounded bg-slate-950/40 border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">F2 elasticity</span>
                            <span className="font-extrabold text-blue-400">{scoreContext.factors.f2}/180</span>
                          </div>
                          <div className="p-2 rounded bg-slate-950/40 border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">F3 digital</span>
                            <span className="font-extrabold text-blue-400">{scoreContext.factors.f3}/220</span>
                          </div>
                          <div className="p-2 rounded bg-slate-950/40 border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">F4 social</span>
                            <span className="font-extrabold text-blue-400">{scoreContext.factors.f4}/200</span>
                          </div>
                          <div className="p-2 rounded bg-slate-950/40 border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">F5 psych</span>
                            <span className="font-extrabold text-blue-400">{scoreContext.factors.f5}/200</span>
                          </div>
                        </div>
                      </div>

                      {loan.application_status === "PENDING" ? (
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-900/60">
                          <button
                            onClick={() => handleUnderwriteLoan(loan._id, loan.merchant_id, "APPROVED", loan.requested_amount)}
                            disabled={actionLoading === loan._id}
                            className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50"
                          >
                            {actionLoading === loan._id ? "Approving..." : "Approve & Disburse Capital"}
                          </button>
                          <button
                            onClick={() => handleUnderwriteLoan(loan._id, loan.merchant_id, "REJECTED", loan.requested_amount)}
                            disabled={actionLoading === loan._id}
                            className="py-2 px-5 text-center text-xs font-bold rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === loan._id ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 text-center rounded-lg border border-slate-900 bg-slate-900/20 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Decided · Disbursal Pipeline Complete
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
