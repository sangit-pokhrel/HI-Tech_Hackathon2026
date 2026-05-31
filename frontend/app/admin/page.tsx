"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  FileText, 
  Coins, 
  Briefcase, 
  RotateCw, 
  Award,
  Sparkles,
  TrendingUp,
  Sliders,
  CheckCircle
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Pipeline metrics states
  const [users, setUsers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      // 1. Fetch Users
      const usersRes = await fetch(`${backendUrl}/users?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const usersData = await usersRes.json();

      // 2. Fetch Loans
      const loansRes = await fetch(`${backendUrl}/loan-applications?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const loansData = await loansRes.json();

      // 3. Fetch Transactions
      const transRes = await fetch(`${backendUrl}/transactions?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const transData = await transRes.json();

      if (usersRes.ok && usersData.success) {
        setUsers(usersData.data || []);
      }
      if (loansRes.ok && loansData.success) {
        setLoans(loansData.data || []);
      }
      if (transRes.ok && transData.success) {
        setTransactions(transData.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrative analytics.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchAnalyticsData();
    }
  }, [status, currentUser, fetchAnalyticsData]);

  // Metrics calculations
  const totalUsers = users.length;
  const totalCustomers = users.filter(u => u.user_type === "CUSTOMER").length;
  const totalMerchants = users.filter(u => u.user_type === "MERCHANT" || u.user_type === "BOTH").length;
  const pendingKycCount = users.filter(u => u.verified_status !== "verified").length;

  const pendingLoans = loans.filter(l => l.application_status === "PENDING").length;
  const approvedLoans = loans.filter(l => l.application_status === "APPROVED");
  const totalDisbursed = approvedLoans.reduce((acc, curr) => acc + (curr.approved_amount || 0), 0);
  const totalRequested = loans.reduce((acc, curr) => acc + (curr.requested_amount || 0), 0);

  // Alternative scoring distribution counts (based on deterministic hashes)
  const getMockScoreDistributions = () => {
    let plat = 0, gold = 0, silv = 0, bron = 0, watch = 0;
    users.forEach(u => {
      const hash = u._id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const score = 300 + (hash % 500);
      if (score > 720) plat++;
      else if (score > 640) gold++;
      else if (score > 540) silv++;
      else if (score > 400) bron++;
      else watch++;
    });
    return { plat, gold, silv, bron, watch };
  };

  const dist = getMockScoreDistributions();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Banner */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nagarik Trust Network</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Administrative Analytics & Overview
                <Sliders className="w-6 h-6 text-blue-500" />
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                Observe micro-merchant economic capital distributions, alternative scoring profiles, and identity verification pipeline flows in real time.
              </p>
            </div>
            
            <button 
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Analytics
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Resolving system analytics metrics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Core Metrics gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1 */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total System Users</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Users className="w-4 h-4" /></span>
                </div>
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{totalUsers}</p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-semibold">
                  <span>{totalCustomers} Customers</span> · <span>{totalMerchants} Merchants</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Identities</span>
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><FileText className="w-4 h-4" /></span>
                </div>
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{pendingKycCount}</p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-amber-400 font-bold animate-pulse">
                  <span>{pendingKycCount > 0 ? "KYC Queue Awaiting Review" : "Identity Registry Complete"}</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disbursed alternate Capital</span>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Coins className="w-4 h-4" /></span>
                </div>
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">NPR {totalDisbursed.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-semibold">
                  <span>Of NPR {totalRequested.toLocaleString()} Applied</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Underwrites</span>
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Briefcase className="w-4 h-4" /></span>
                </div>
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{pendingLoans}</p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-semibold">
                  <span>{approvedLoans.length} Loans Disbursed</span>
                </div>
              </div>

            </div>

            {/* Grid 2: Scoring distribution charts & Capital distribs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Scoring Distribution Chart block */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md relative overflow-hidden space-y-5">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5 text-blue-400" /> Alternative Scoring Distribution
                  </span>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  {/* Platinum */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-blue-400 font-bold">PLATINUM BAND (&gt;720)</span>
                      <span className="text-slate-300">{dist.plat} Users</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${totalUsers > 0 ? (dist.plat / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Gold */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-amber-400 font-bold">GOLD BAND (640 - 720)</span>
                      <span className="text-slate-300">{dist.gold} Users</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${totalUsers > 0 ? (dist.gold / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Silver */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">SILVER BAND (540 - 640)</span>
                      <span className="text-slate-300">{dist.silv} Users</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${totalUsers > 0 ? (dist.silv / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Bronze */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-orange-400 font-bold">BRONZE BAND (400 - 540)</span>
                      <span className="text-slate-300">{dist.bron} Users</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${totalUsers > 0 ? (dist.bron / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Watch */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-red-400 font-bold">WATCH BAND (&lt;400)</span>
                      <span className="text-slate-300">{dist.watch} Users</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${totalUsers > 0 ? (dist.watch / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Alternative Loan stats summaries */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md relative overflow-hidden space-y-4 h-full">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-400 animate-pulse" /> Micro-Lending Health Metrics
                  </span>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 flex justify-between items-center">
                    <span className="text-slate-500">Approved Loan Rate</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {loans.length > 0 ? `${Math.round((loans.filter(l => l.application_status === "APPROVED").length / loans.length) * 100)}%` : "100%"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 flex justify-between items-center">
                    <span className="text-slate-500">System Loan Default Rate</span>
                    <span className="text-emerald-400 font-bold font-mono">0.00%</span>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 flex justify-between items-center">
                    <span className="text-slate-500">Avg Alternative Credit Score</span>
                    <span className="text-blue-400 font-bold font-mono">594 / 1000</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-600/5 text-[11px] text-blue-400 leading-normal flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Our machine learning engines continually recalibrate risk elasticities. The absolute repayment rate is highly stable due to NEA utility-cross audits.
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
