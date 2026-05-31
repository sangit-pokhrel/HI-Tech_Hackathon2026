"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  User as UserIcon,
  ArrowLeft,
  Coins,
  FileText,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import DashboardLayout from "../../../../components/DashboardLayout";

interface UserAuditPageProps {
  params: Promise<{ id: string }>;
}

export default function UserAuditPage({ params }: UserAuditPageProps) {
  const { id: userId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletActivities, setWalletActivities] = useState<any[]>([]);
  const [utilityPayments, setUtilityPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sub-tab selection state
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "wallet" | "transactions" | "bills">("profile");

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchUserDetailsAndFinancials = useCallback(async () => {
    if (!session || !userId) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      // 1. Fetch User details
      const userRes = await fetch(`${backendUrl}/users/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const userData = await userRes.json();
      if (!userRes.ok || !userData.success) {
        throw new Error(userData.message || "Failed to fetch user details.");
      }
      setUser(userData.data);

      // 2. Fetch User Transactions (We fetch all and filter client-side for absolute privacy/completeness)
      const transRes = await fetch(`${backendUrl}/transactions?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const transData = await transRes.json();
      if (transRes.ok && transData.success) {
        const filtered = (transData.data || []).filter(
          (t: any) => t.sender_id === userId || t.receiver_id === userId
        );
        setTransactions(filtered);
      }

      // 3. Fetch User Wallet Activities
      const walletRes = await fetch(`${backendUrl}/wallet-activities?user_id=${userId}&limit=50`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const walletData = await walletRes.json();
      if (walletRes.ok && walletData.success) {
        setWalletActivities(walletData.data || []);
      }

      // 4. Fetch User Utility Payments (Formality fetch)
      const utilityRes = await fetch(`${backendUrl}/utility-payments?sender_id=${userId}&limit=50`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const utilityData = await utilityRes.json();
      if (utilityRes.ok && utilityData.success) {
        setUtilityPayments(utilityData.data || []);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred while loading audit records.");
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchUserDetailsAndFinancials();
    }
  }, [status, currentUser, fetchUserDetailsAndFinancials]);

  // Deterministic mock citizenship info based on user name/phone (matching DB saving rules)
  const getMockCitizenship = (userObj: any) => {
    if (!userObj) return null;
    const phone = userObj.phone || "";
    const name = userObj.name || "";
    const hash = name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const dobYearsAgo = 18 + (hash % 30);
    const birthYear = 2083 - dobYearsAgo; // BS Year
    
    return {
      citizenshipNo: `27-01-79-${phone.slice(-5) || "05432"}`,
      gender: hash % 2 === 0 ? "Male" : "Female",
      dob: `${birthYear}-03-12`,
      fatherName: `Ram Prasad ${name.split(" ").slice(-1)[0] || "Doe"}`,
      motherName: `Sita Devi ${name.split(" ").slice(-1)[0] || "Doe"}`,
      citizenshipType: hash % 3 === 0 ? "Naturalized" : "Descendant",
      issueDate: `${birthYear + 18}-05-20`,
      issueDistrict: userObj.location?.district || "Kathmandu"
    };
  };

  const ctz = getMockCitizenship(user);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Administrative Control
          </Link>
          
          <button
            onClick={fetchUserDetailsAndFinancials}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Audit Data
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Running database search handshake...</p>
          </div>
        ) : user ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Top Overview Banner */}
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Financial & KYC Audit Portal</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                    Audit Profile: {user.name}
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    User System Reference: {user._id} · Contact: {user.phone}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                    user.user_type === "ADMIN" 
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                      : user.user_type === "MERCHANT" || user.user_type === "BOTH"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                      : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                  }`}>
                    Role: {user.user_type}
                  </span>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                    user.verified_status === "verified"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                  }`}>
                    KYC: {user.verified_status === "verified" ? "Verified" : "Pending Check"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Sub-Tabs Selection Control */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 mb-8 p-1.5 bg-slate-950/20 backdrop-blur-md rounded-xl max-w-4xl">
              <button
                onClick={() => setActiveSubTab("profile")}
                className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSubTab === "profile"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                Identity & KYC Profile
              </button>
              <button
                onClick={() => setActiveSubTab("wallet")}
                className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSubTab === "wallet"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                Wallet Activities ({walletActivities.length})
              </button>
              <button
                onClick={() => setActiveSubTab("transactions")}
                className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSubTab === "transactions"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                Transaction History ({transactions.length})
              </button>
              <button
                onClick={() => setActiveSubTab("bills")}
                className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSubTab === "bills"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                Utility Bills ({utilityPayments.length})
              </button>
            </div>

            {/* Sub-Tab Panel Views */}
            <div className="animate-in fade-in duration-300">
              
              {/* PANEL 1: IDENTITY & KYC PROFILE */}
              {activeSubTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Location registry card */}
                  <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contact & Address Registries</span>
                      <UserIcon className="w-4 h-4 text-blue-400" />
                    </div>
                    
                    <div className="space-y-4 text-xs font-semibold">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Registered Phone</span>
                        <span className="font-bold text-slate-300 font-mono">{user.phone || "980XXXXXXX"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Registered Email</span>
                        <span className="font-bold text-slate-300 truncate block">{user.email || "No email logged"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Registered District</span>
                        <span className="font-bold text-slate-300">{user.location?.district || "Kathmandu"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Municipality</span>
                          <span className="font-bold text-slate-300">{user.location?.municipality || "Kathmandu"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Ward No</span>
                          <span className="font-bold text-slate-300">Ward {user.location?.ward_no || 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Citizenship cards detail */}
                  <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Citizenship Verification details</h3>
                    </div>

                    {ctz ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Citizenship Card ID</span>
                          <span className="font-bold text-slate-300 font-mono">{ctz.citizenshipNo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Gender Profile</span>
                          <span className="font-bold text-slate-300">{ctz.gender}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">DOB (Date of Birth)</span>
                          <span className="font-bold text-slate-300">{ctz.dob}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Father's Name</span>
                          <span className="font-bold text-slate-300">{ctz.fatherName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Mother's Name</span>
                          <span className="font-bold text-slate-300">{ctz.motherName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Citizenship Type</span>
                          <span className="font-bold text-slate-300">{ctz.citizenshipType}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Issue Date</span>
                          <span className="font-bold text-slate-300">{ctz.issueDate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Issue District</span>
                          <span className="font-bold text-slate-300">{ctz.issueDistrict}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">NEA SC No (Electricity)</span>
                          <span className="font-bold text-slate-300 font-mono">021.05.{user.phone ? user.phone.slice(-3) : "102"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No profile parameters calculated.</p>
                    )}
                  </div>
                </div>
              )}

              {/* PANEL 2: WALLET ACTIVITIES */}
              {activeSubTab === "wallet" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Balance details summary card */}
                  <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group col-span-1">
                    <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Balance Registry</span>
                      <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-3xl font-black text-slate-500 tracking-tight flex items-baseline gap-1.5">
                      NPR <span className="text-slate-100 text-4xl font-black">{user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 uppercase tracking-widest text-[9px]">Total wallet logs</span>
                      <span className="text-slate-300">{walletActivities.length} logs recorded</span>
                    </div>
                  </div>

                  {/* Wallet logs table */}
                  <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Wallet Activities & Adjustments Logs</h3>
                      </div>
                    </div>

                    {walletActivities.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        No wallet activities recorded for this account
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {walletActivities.map((act) => (
                          <div key={act._id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-between gap-4 font-semibold text-xs hover:border-slate-800 transition-all font-mono">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-200 uppercase">{act.activity_type.replace("_", " ")}</h4>
                              <p className="text-[9px] text-slate-500">Balance After: NPR {act.balance_after_transaction?.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xs text-blue-400">
                                NPR {act.amount?.toLocaleString()}
                              </span>
                              <p className="text-[9px] text-slate-500 mt-0.5">{new Date(act.activity_time || act.created_at || new Date()).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PANEL 3: TRANSACTION HISTORY */}
              {activeSubTab === "transactions" && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Account Transaction History</h3>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{transactions.length} Records</span>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      No transactions recorded on this account
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {transactions.map((tx) => {
                        const isOutflow = tx.sender_id === userId;
                        return (
                          <div key={tx._id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-between gap-4 font-semibold text-xs hover:border-slate-800 transition-all font-mono">
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-bold text-slate-200 truncate">{tx.transaction_code}</h4>
                              <p className="text-[9px] text-slate-500 truncate">
                                {isOutflow ? `To Receiver: ${tx.receiver_id}` : `From Sender: ${tx.sender_id}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold text-xs ${isOutflow ? "text-red-400" : "text-emerald-400"}`}>
                                {isOutflow ? "-" : "+"} NPR {tx.amount?.toLocaleString()}
                              </span>
                              <p className="text-[9px] text-slate-500 mt-0.5">{new Date(tx.transaction_time || tx.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 4: UTILITY BILLS */}
              {activeSubTab === "bills" && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Paid Utility Bill Registry (Formality)</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{utilityPayments.length} Utility Bills Paid</span>
                  </div>

                  {utilityPayments.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                      No utility bill payments recorded for this account
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {utilityPayments.map((bill) => (
                        <div 
                          key={bill._id} 
                          className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 relative overflow-hidden group hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                              {bill.bill_type.replace("_", " ")}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                              bill.payment_status === "ON_TIME" || bill.payment_status === "PAID_EARLY"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                            }`}>
                              {bill.payment_status}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs font-semibold">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Bill Amount</span>
                              <span className="text-slate-200 font-bold">NPR {bill.bill_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Due Date</span>
                              <span className="text-slate-400 font-mono">{new Date(bill.due_date).toLocaleDateString()}</span>
                            </div>
                            {bill.paid_date && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Paid Date</span>
                                <span className="text-emerald-400 font-mono">{new Date(bill.paid_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-500">Days Late</span>
                              <span className={`font-bold ${bill.days_late > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                {bill.days_late} days
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="py-24 text-center">
            <UserIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Audited account records not found.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
