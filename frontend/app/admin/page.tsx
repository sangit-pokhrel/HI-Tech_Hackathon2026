"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Coins, 
  Briefcase, 
  RotateCw, 
  Search, 
  Award,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  User as UserIcon
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"kyc" | "loans" | "transactions" | "users">("kyc");
  const [kycTab, setKycTab] = useState<"pending" | "all">("pending");
  const [loanTab, setLoanTab] = useState<"pending" | "all">("pending");
  
  // Expand states for detailed inspections
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUser = session?.user as any;

  // Protect Admin route on the client side
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  // Fetch all administrative pipeline data
  const fetchAdminData = useCallback(async () => {
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

      // 2. Fetch Loan Applications
      const loansRes = await fetch(`${backendUrl}/loan-applications?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const loansData = await loansRes.json();

      // 3. Fetch Every Transaction (Global Ledger)
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
        setLoanApplications(loansData.data || []);
      }
      if (transRes.ok && transData.success) {
        setTransactions(transData.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrative records.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchAdminData();
    }
  }, [status, currentUser, fetchAdminData]);

  // Approve / Flag KYC Identity Verification
  const handleUpdateKycStatus = async (userId: string, newStatus: "verified" | "unverified") => {
    setActionLoading(userId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ verified_status: newStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update KYC status");
      }

      // Live update locally
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, verified_status: newStatus } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update KYC identity status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Underwrite Merchant Loan Application (Approve/Reject)
  const handleUnderwriteLoan = async (loanId: string, merchantId: string, status: "APPROVED" | "REJECTED", requestedAmount: number) => {
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
          application_status: status,
          approved_amount: status === "APPROVED" ? requestedAmount : 0,
          decided_at: new Date()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to underwrite loan");
      }

      // Live update locally
      setLoanApplications(prev => prev.map(l => l._id === loanId ? { ...l, application_status: status, approved_amount: status === "APPROVED" ? requestedAmount : 0 } : l));
    } catch (err: any) {
      alert(err.message || "Failed to update loan application.");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate Administrative Metrics
  const totalUsers = users.length;
  const totalMerchants = users.filter(u => u.user_type === "MERCHANT" || u.user_type === "BOTH").length;
  const pendingKycCount = users.filter(u => u.verified_status !== "verified").length;
  
  const pendingLoans = loanApplications.filter(l => l.application_status === "PENDING");
  const approvedLoans = loanApplications.filter(l => l.application_status === "APPROVED");
  const totalDisbursed = approvedLoans.reduce((acc, curr) => acc + (curr.approved_amount || 0), 0);
  const totalCapitalRequested = loanApplications.reduce((acc, curr) => acc + (curr.requested_amount || 0), 0);

  // Filters based on search queries and tabs
  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.phone.includes(term) || (u.email && u.email.toLowerCase().includes(term)) || u._id.toLowerCase().includes(term);
    const matchesTab = kycTab === "pending" ? u.verified_status !== "verified" : true;
    return matchesSearch && matchesTab;
  });

  const filteredLoans = loanApplications.filter(l => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = l._id.toLowerCase().includes(term) || l.merchant_id.toLowerCase().includes(term) || l.loan_purpose.toLowerCase().includes(term);
    const matchesTab = loanTab === "pending" ? l.application_status === "PENDING" : true;
    return matchesSearch && matchesTab;
  });

  const filteredTransactions = transactions.filter(t => {
    const term = searchQuery.toLowerCase();
    return t.transaction_code.toLowerCase().includes(term) || t.sender_id.toLowerCase().includes(term) || t.receiver_id.toLowerCase().includes(term) || (t.remarks && t.remarks.toLowerCase().includes(term));
  });

  const getMockCreditFactors = (userId: string) => {
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
              Administrative Control Console
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Underwrite micro-merchants with alternative credit factors, verify Nepalese Citizenship credentials, and monitor macro economic capital distributions.
            </p>
          </div>
          
          <button 
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Pipeline Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* METRIC GAUGES CARD ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Accounts</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Users className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{totalUsers}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-semibold text-slate-400">{totalMerchants} Active Partners</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Identities</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><FileText className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{pendingKycCount}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-bold text-amber-400 animate-pulse">{pendingKycCount > 0 ? "Awaiting Audits" : "Complete Registry"}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disbursed Capital</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Coins className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">NPR {totalDisbursed.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-semibold text-slate-400">From NPR {totalCapitalRequested.toLocaleString()} Requests</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Underwrites</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><Briefcase className="w-4 h-4" /></span>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{pendingLoans.length}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-semibold text-slate-400">{approvedLoans.length} Approved Requests</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC PIPELINE SECTION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 mb-8 p-1.5 bg-slate-950/20 backdrop-blur-md rounded-xl max-w-4xl">
        <button
          onClick={() => setActiveTab("kyc")}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "kyc"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          Identity Verification Queue ({pendingKycCount})
        </button>
        <button
          onClick={() => setActiveTab("loans")}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "loans"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          Loans Underwriting Queue ({pendingLoans.length})
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          Global Transactions Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-slate-800 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          User Wallet & Balances ({totalUsers})
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md flex items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "kyc" ? "Search awaiting checks..." :
              activeTab === "loans" ? "Search loan underwriting queue..." :
              activeTab === "transactions" ? "Search transaction codes, senders, receivers..." :
              "Search registered usernames, IDs, balances..."
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Alt Underwrite Calibrated</span>
        </div>
      </div>

      {/* RENDER DYNAMIC COMPONENT VIEWS */}
      {loading ? (
        <div className="py-16 text-center">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Fetching system records...</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          
          {/* TAB 1: IDENTITY REVIEW PIPELINE */}
          {activeTab === "kyc" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">KYC Verification Submissions</h3>
                <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setKycTab("pending")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${kycTab === "pending" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Awaiting Check
                  </button>
                  <button 
                    onClick={() => setKycTab("all")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${kycTab === "all" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    All Directory
                  </button>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  No identity submissions in query
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isExpanded = expandedUser === user._id;
                  const isKycVerified = user.verified_status === "verified";
                  
                  return (
                    <div 
                      key={user._id}
                      className={`rounded-xl border transition-all ${
                        isExpanded 
                          ? "border-blue-500/40 bg-slate-950/50 shadow-lg shadow-blue-500/5" 
                          : "border-slate-900 bg-slate-950/20 hover:border-slate-800"
                      }`}
                    >
                      <div 
                        onClick={() => setExpandedUser(isExpanded ? null : user._id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{user.name}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isKycVerified 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                            }`}>
                              {isKycVerified ? "Verified" : "Pending Verification"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">{user._id} · {user.phone}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-900/60 space-y-4 text-xs animate-in fade-in duration-300">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-3 rounded-lg border border-slate-900/80">
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Account Type</span>
                              <span className="font-bold text-slate-300">{user.user_type}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Registered Email</span>
                              <span className="font-bold text-slate-300 truncate block">{user.email || "No email"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Wallet Balance</span>
                              <span className="font-bold text-emerald-400">NPR {user.balance?.toLocaleString() || "0"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">District Registered</span>
                              <span className="font-bold text-slate-300">{user.location?.district}, Ward {user.location?.ward_no}</span>
                            </div>
                          </div>

                          {/* Citizenship details block */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Citizenship Details</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Citizenship No</span>
                                <span className="font-bold text-slate-300 font-mono">27-01-79-{user.phone ? user.phone.slice(-5) : "05432"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Gender</span>
                                <span className="font-bold text-slate-300">Male</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">DOB (Date of Birth)</span>
                                <span className="font-bold text-slate-300">2045-03-12</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Father's Name</span>
                                <span className="font-bold text-slate-300">Ram Prasad {user.name ? user.name.split(" ").slice(-1)[0] : "Doe"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Mother's Name</span>
                                <span className="font-bold text-slate-300">Sita Devi {user.name ? user.name.split(" ").slice(-1)[0] : "Doe"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">District of Issue</span>
                                <span className="font-bold text-slate-300">{user.location?.district || "Kathmandu"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Utility credentials block */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Utility Billing Credentials (Alternative Check)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">NEA SC No (Electricity)</span>
                                <span className="font-bold text-slate-300 font-mono">021.05.{user.phone ? user.phone.slice(-3) : "102"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Water Customer ID (KUKL)</span>
                                <span className="font-bold text-slate-300 font-mono">W-{user.phone ? user.phone.slice(-6) : "789052"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-900/60">
                            {isKycVerified ? (
                              <button
                                onClick={() => handleUpdateKycStatus(user._id, "unverified")}
                                disabled={actionLoading === user._id}
                                className="flex-1 py-2 text-center text-xs font-bold rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === user._id ? "Processing..." : "Flag & Reject Identity"}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleUpdateKycStatus(user._id, "verified")}
                                  disabled={actionLoading === user._id}
                                  className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50"
                                >
                                  {actionLoading === user._id ? "Approving..." : "Approve Identity Verification"}
                                </button>
                                <button
                                  disabled
                                  className="px-3.5 py-2 text-center text-xs font-bold rounded-lg border border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LOANS UNDERWRITING PIPELINE */}
          {activeTab === "loans" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Alternative Credit Loan Pipeline</h3>
                <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setLoanTab("pending")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${loanTab === "pending" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                  >
                    Awaiting Review
                  </button>
                  <button 
                    onClick={() => setLoanTab("all")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${loanTab === "all" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                  >
                    All Ledger
                  </button>
                </div>
              </div>

              {filteredLoans.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  No loan applications in query
                </div>
              ) : (
                filteredLoans.map((loan) => {
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
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
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
                        <div className="px-4 pb-4 pt-2 border-t border-slate-900/60 space-y-4 text-xs animate-in fade-in duration-300">
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
                              <span className="text-[10px] font-bold text-blue-400">{scoreContext.riskBand} Band</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              <div className="text-center p-2 rounded bg-slate-950/40 border border-slate-900">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">F1 rhythm</span>
                                <span className="font-extrabold text-blue-400">{scoreContext.factors.f1}/200</span>
                              </div>
                              <div className="text-center p-2 rounded bg-slate-950/40 border border-slate-900">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">F2 elasticity</span>
                                <span className="font-extrabold text-blue-400">{scoreContext.factors.f2}/180</span>
                              </div>
                              <div className="text-center p-2 rounded bg-slate-950/40 border border-slate-900">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">F3 digital</span>
                                <span className="font-extrabold text-blue-400">{scoreContext.factors.f3}/220</span>
                              </div>
                              <div className="text-center p-2 rounded bg-slate-950/40 border border-slate-900">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">F4 social</span>
                                <span className="font-extrabold text-blue-400">{scoreContext.factors.f4}/200</span>
                              </div>
                              <div className="text-center p-2 rounded bg-slate-950/40 border border-slate-900">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">F5 psych</span>
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
                })
              )}
            </div>
          )}

          {/* TAB 3: GLOBAL TRANSACTIONS LEDGER */}
          {activeTab === "transactions" && (
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md max-w-6xl mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Global Transactions Audit Ledger</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{filteredTransactions.length} Transactions Found</span>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  No system transactions record found in query
                </div>
              ) : (
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                        <th className="py-3 px-4">TX Code</th>
                        <th className="py-3 px-4">Sender</th>
                        <th className="py-3 px-4"></th>
                        <th className="py-3 px-4">Receiver</th>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-900/20 transition-all font-semibold">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{tx.transaction_code}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono truncate max-w-[120px]">{tx.sender_id}</td>
                          <td className="py-3.5 px-2 text-slate-500">
                            {tx.payment_channel === "QR" ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono truncate max-w-[120px]">{tx.receiver_id}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 text-slate-300 font-bold">
                              {tx.payment_channel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            NPR {tx.amount?.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              tx.status === "SUCCESS" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-right font-mono text-[10px]">
                            {new Date(tx.transaction_time || tx.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USER WALLET & BALANCES DIRECTORY */}
          {activeTab === "users" && (
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md max-w-6xl mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">System Users & Wallet Balances Directory</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{totalUsers} Registered Accounts</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  No accounts found in query
                </div>
              ) : (
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Account Role</th>
                        <th className="py-3 px-4">Identity Verification</th>
                        <th className="py-3 px-4 text-right">Wallet Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-900/20 transition-all font-semibold">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{user._id}</td>
                          <td className="py-3.5 px-4 text-slate-200 font-bold">{user.name}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                            {user.phone} {user.email && `· ${user.email}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                              user.user_type === "ADMIN" 
                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                : user.user_type === "MERCHANT" || user.user_type === "BOTH"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                                : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                            }`}>
                              {user.user_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              user.verified_status === "verified"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                            }`}>
                              {user.verified_status === "verified" ? "Verified KYC" : "Pending Verification"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-mono text-xs">
                            NPR {user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
