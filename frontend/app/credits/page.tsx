"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { 
  RotateCw, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Clock, 
  Network, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function CreditsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNoScore, setHasNoScore] = useState(false);

  // Apply simulation state
  const [isApplied, setIsApplied] = useState(false);
  const [applyStep, setApplyStep] = useState(0); 
  const [applyLoading, setApplyLoading] = useState(false);

  // Redirect check state
  const [showNoScoreWarning, setShowNoScoreWarning] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("redirectReason") === "no-score") {
        setShowNoScoreWarning(true);
      }
    }
  }, []);

  const fetchScoreData = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");
    setHasNoScore(false);
    try {
      const backendUrl = "/api";
      const res = await fetch(`${backendUrl}/users/${currentUser.id}/score`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error_code === "NO_SCORE_RECORD") {
          setHasNoScore(true);
        }
        throw new Error(data.message || "Failed to fetch credit score");
      }
      setScoreData(data);
      setHasNoScore(false);
      setIsApplied(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching score.");
    } finally {
      setLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    fetchScoreData();
  }, [fetchScoreData]);

  // Apply for score simulation
  const handleApplyForScore = async () => {
    setApplyLoading(true);
    setError("");
    
    try {
      setApplyStep(1);
      await new Promise(resolve => setTimeout(resolve, 1200));

      setApplyStep(2);
      await new Promise(resolve => setTimeout(resolve, 1200));

      setApplyStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsApplied(true);
    } catch (err: any) {
      setError("Failed to submit credit score application.");
    } finally {
      setApplyLoading(false);
      setApplyStep(0);
    }
  };

  // Helper to color code Score Bands
  const getBandStyles = (band: string) => {
    switch (band?.toUpperCase()) {
      case "PLATINUM":
        return { bg: "bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold", label: "Platinum Rating" };
      case "GOLD":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold", label: "Gold Rating" };
      case "SILVER":
        return { bg: "bg-slate-300/10 border-slate-300/30 text-slate-300 font-bold", label: "Silver Rating" };
      case "BRONZE":
        return { bg: "bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold", label: "Bronze Rating" };
      case "WATCH":
        return { bg: "bg-red-500/10 border-red-500/30 text-red-400 font-bold", label: "Watch Rating" };
      default:
        return { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400 font-bold", label: "Thin File" };
    }
  };

  return (
    <DashboardLayout 
      scoreLoading={loading} 
      onRecalculate={fetchScoreData}
      showRecalculate={!hasNoScore && !!scoreData}
    >
      {showNoScoreWarning && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold mb-6 flex items-start gap-2.5 leading-relaxed animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>You must activate your Nagarik Credit Score rating before submitting micro-credit loan applications. Run alternative behavioral score audits below first.</span>
        </div>
      )}

      {error && !hasNoScore && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium mb-8">
          {error}
        </div>
      )}

      {loading ? (
        /* Pulsing Skeleton Loaders Inside Shared Navigation */
        <div className="space-y-6 animate-pulse">
          <div className="h-5 bg-slate-900 rounded w-1/3 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-900 rounded w-1/2" />
                <div className="h-4 bg-slate-900 rounded w-10" />
              </div>
              <div className="h-2 bg-slate-900 rounded" />
            </div>
          ))}
        </div>
      ) : hasNoScore ? (
        /* Simulated apply trigger if merchant doesn't have an active calculated score */
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 max-w-2xl mx-auto my-6">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-35 group-hover:opacity-100 blur transition duration-700" />
          
          <div className="relative p-10 rounded-2xl bg-slate-950/80 text-center">
            {isApplied ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                  Application Submitted Successfully
                </h2>
                <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                  Your alternative credit profile has been queued for verification. Nagarik Credits AI models will audit your digital transactions, NEA utility bill records, and B2B reputation networks.
                </p>

                <div className="mt-8 border border-slate-900 bg-slate-900/40 p-4 rounded-xl max-w-sm mx-auto text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Merchant KYC Registry</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Cleared</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">NEA Utility Database Sync</span>
                    <span className="text-blue-400 flex items-center gap-1.5 font-semibold"><RotateCw className="w-3.5 h-3.5 animate-spin" /> In Progress</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Transaction Auditing</span>
                    <span className="text-blue-400 flex items-center gap-1.5 font-semibold"><RotateCw className="w-3.5 h-3.5 animate-spin" /> In Progress</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Alternative Risk Calculation</span>
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">● Pending Audit</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-6 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                  Activate Your Credit Rating Index
                </h2>
                <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                  Your profile requires a machine-learning scoring audit. Build up daily transaction registries and settle utilities to calculate your blend trust index.
                </p>

                {applyLoading ? (
                  <div className="mt-8 py-4 flex flex-col items-center gap-3">
                    <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase animate-pulse">
                      {applyStep === 1 && "Verifying profile KYC registry..."}
                      {applyStep === 2 && "Analyzing anti-fraud transactional velocity..."}
                      {applyStep === 3 && "Submitting scoring request..."}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleApplyForScore}
                    className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg shadow-blue-500/15 cursor-pointer active:scale-[0.98]"
                  >
                    Apply for Credit Score
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* CORE SCORING AND FACTORS VIEW */
        <div className="space-y-8">
          {/* Summary Score Card */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-600/5 blur-xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <span className={`w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-lg text-slate-200 border bg-slate-900 ${scoreData.score >= 700 ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                {scoreData.score}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-200">Active Alternative Rating</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on 5 non-traditional indicators</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl border text-xs ${getBandStyles(scoreData.score_band).bg}`}>
                {getBandStyles(scoreData.score_band).label}
              </span>
              <span className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                Confidence ±{scoreData.confidence_interval} Points
              </span>
            </div>
          </div>

          {/* Factor Breakdown Panel */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-100 mb-6">Behavioral Factor Score Analysis</h2>

            <div className="space-y-6">
              {/* F1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    F1: Transaction Consistency & Frequency (Livelihood Rhythm)
                  </span>
                  <span className="text-slate-400 font-mono">{scoreData.factor_breakdown.F1_transaction_consistency.score} / {scoreData.factor_breakdown.F1_transaction_consistency.max}</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(scoreData.factor_breakdown.F1_transaction_consistency.score / scoreData.factor_breakdown.F1_transaction_consistency.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/60 mt-1">
                  {scoreData.factor_breakdown.F1_transaction_consistency.notes}
                </p>
              </div>

              {/* F2 */}
              <div className="space-y-2 border-t border-slate-900/60 pt-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    F2: Cash Flow Health & Average Daily Balances (Elasticity buffer)
                  </span>
                  <span className="text-slate-400 font-mono">{scoreData.factor_breakdown.F2_cashflow_health.score} / {scoreData.factor_breakdown.F2_cashflow_health.max}</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(scoreData.factor_breakdown.F2_cashflow_health.score / scoreData.factor_breakdown.F2_cashflow_health.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/60 mt-1">
                  {scoreData.factor_breakdown.F2_cashflow_health.notes}
                </p>
              </div>

              {/* F3 */}
              <div className="space-y-2 border-t border-slate-900/60 pt-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    F3: Utility Payment Timeliness & Settlement Reliability
                  </span>
                  <span className="text-slate-400 font-mono">{scoreData.factor_breakdown.F3_payment_reliability.score} / {scoreData.factor_breakdown.F3_payment_reliability.max}</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(scoreData.factor_breakdown.F3_payment_reliability.score / scoreData.factor_breakdown.F3_payment_reliability.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/60 mt-1">
                  {scoreData.factor_breakdown.F3_payment_reliability.notes}
                </p>
              </div>

              {/* F4 */}
              <div className="space-y-2 border-t border-slate-900/60 pt-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    F4: Network Integrity, Guarantor Trust & Anti-Staging Audit
                  </span>
                  <span className="text-slate-400 font-mono">{scoreData.factor_breakdown.F4_integrity.score} / {scoreData.factor_breakdown.F4_integrity.max}</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(scoreData.factor_breakdown.F4_integrity.score / scoreData.factor_breakdown.F4_integrity.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/60 mt-1">
                  {scoreData.factor_breakdown.F4_integrity.notes}
                </p>
              </div>

              {/* F5 */}
              <div className="space-y-2 border-t border-slate-900/60 pt-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Network className="w-4 h-4 text-amber-400" />
                    F5: External Signals (NEA electricity calibration & ISP continuity)
                  </span>
                  <span className="text-slate-400 font-mono">{scoreData.factor_breakdown.F5_external_signals.score} / {scoreData.factor_breakdown.F5_external_signals.max}</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(scoreData.factor_breakdown.F5_external_signals.score / scoreData.factor_breakdown.F5_external_signals.max) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/60 mt-1">
                  {scoreData.factor_breakdown.F5_external_signals.notes}
                </p>
              </div>
            </div>
          </div>

          {/* Alternative Scoring Gaps Checklist */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              Alternative Ledger Integrations Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/40 border border-slate-900/60">
                <span className="text-slate-400 font-medium">QR Retail Ledger</span>
                {!scoreData.data_gaps.includes("TRANSACTIONS") ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Activated</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 font-bold"><XCircle className="w-3.5 h-3.5" /> Gaps</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/40 border border-slate-900/60">
                <span className="text-slate-400 font-medium">Digital Wallet Velocity</span>
                {!scoreData.data_gaps.includes("WALLET_ACTIVITY") ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Activated</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 font-bold"><XCircle className="w-3.5 h-3.5" /> Gaps</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/40 border border-slate-900/60">
                <span className="text-slate-400 font-medium">NEA Utility payment database</span>
                {!scoreData.data_gaps.includes("UTILITY") ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Activated</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 font-bold"><XCircle className="w-3.5 h-3.5" /> Gaps</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/40 border border-slate-900/60">
                <span className="text-slate-400 font-medium">Bazaar Merchant Registry sync</span>
                {!scoreData.data_gaps.includes("MERCHANT_DATA") ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Activated</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 font-bold"><XCircle className="w-3.5 h-3.5" /> Gaps</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
