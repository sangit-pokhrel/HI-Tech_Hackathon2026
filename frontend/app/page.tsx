"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  ShieldCheck, 
  RotateCw, 
  Sparkles,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  Coins,
  FileText,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("CUSTOMER");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State
  const [scoreData, setScoreData] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  // Apply simulation state
  const [hasNoScore, setHasNoScore] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applyStep, setApplyStep] = useState(0); 
  const [applyLoading, setApplyLoading] = useState(false);

  // Customer Dashboard State
  const [customerTrans, setCustomerTrans] = useState<any[]>([]);
  const [customerBills, setCustomerBills] = useState<any[]>([]);
  const [customerActivities, setCustomerActivities] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const isSignedIn = status === "authenticated";
  const currentUser = session?.user as any;

  // Fetch Score Data from Protected Elysia Backend
  const fetchScoreData = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    setScoreLoading(true);
    setScoreError("");
    setHasNoScore(false);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;
      
      const res = await fetch(`${backendUrl}/users/${currentUser.id}/score`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      setScoreError(err.message || "An unexpected error occurred while fetching score.");
    } finally {
      setScoreLoading(false);
    }
  }, [session, currentUser]);

  // Fetch Customer Dashboard Data (Wallet, Transactions, Utility bills formality)
  const fetchCustomerDashboardData = useCallback(async () => {
    if (!session || currentUser?.user_type !== "CUSTOMER") return;
    setCustomerLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;
      
      // 1. Fetch transactions where sender/receiver is user
      const transRes = await fetch(`${backendUrl}/transactions?limit=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const transData = await transRes.json();
      if (transRes.ok && transData.success) {
        const list = transData.data || [];
        const filtered = list.filter((t: any) => t.sender_id === currentUser.id || t.receiver_id === currentUser.id);
        setCustomerTrans(filtered);
      }

      // 2. Fetch Utility payments paid by user
      const billsRes = await fetch(`${backendUrl}/utility-payments?sender_id=${currentUser.id}&limit=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const billsData = await billsRes.json();
      if (billsRes.ok && billsData.success) {
        setCustomerBills(billsData.data || []);
      }

      // 3. Fetch Wallet Activities
      const actRes = await fetch(`${backendUrl}/wallet-activities?user_id=${currentUser.id}&limit=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const actData = await actRes.json();
      if (actRes.ok && actData.success) {
        setCustomerActivities(actData.data || []);
      }
    } catch (err) {
      console.error("Failed to load customer dashboard details:", err);
    } finally {
      setCustomerLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (isSignedIn) {
      if (currentUser?.user_type === "ADMIN") {
        router.push("/admin");
      } else if (currentUser?.user_type === "CUSTOMER") {
        fetchCustomerDashboardData();
      } else {
        fetchScoreData();
      }
    }
  }, [isSignedIn, currentUser, router, fetchScoreData, fetchCustomerDashboardData]);

  // Apply for a new Credit Score (Simulated Frontend-Only Flow)
  const handleApplyForScore = async () => {
    setApplyLoading(true);
    setScoreError("");
    
    try {
      setApplyStep(1);
      await new Promise(resolve => setTimeout(resolve, 1200));

      setApplyStep(2);
      await new Promise(resolve => setTimeout(resolve, 1200));

      setApplyStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsApplied(true);
    } catch (err: any) {
      setScoreError("Failed to submit credit score application.");
    } finally {
      setApplyLoading(false);
      setApplyStep(0);
    }
  };

  // Handle Login Form Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please fill in all fields");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setAuthError("Invalid email or password");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Registration Form Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !password) {
      setAuthError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const regRes = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password, user_type: userType }),
      });

      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setAuthError(regData.message || "Failed to register account");
        setAuthLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setAuthError("Account created but failed to sign in automatically");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper to color code Score Bands
  const getBandStyles = (band: string) => {
    switch (band?.toUpperCase()) {
      case "PLATINUM":
        return { bg: "bg-blue-500/10 border-blue-500/30 text-blue-400", label: "Platinum Band" };
      case "GOLD":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", label: "Gold Band" };
      case "SILVER":
        return { bg: "bg-slate-300/10 border-slate-300/30 text-slate-300", label: "Silver Band" };
      case "BRONZE":
        return { bg: "bg-orange-500/10 border-orange-500/30 text-orange-400", label: "Bronze Band" };
      case "WATCH":
        return { bg: "bg-red-500/10 border-red-500/30 text-red-400", label: "Watch Band" };
      default:
        return { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400", label: "Thin File" };
    }
  };

  if (status === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#03060f]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading Nagarik Credits...</p>
        </div>
      </div>
    );
  }

  // 1. GUEST FORM
  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#03060f] py-12 px-4">
        {/* Radial glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none animate-pulse duration-[15000ms]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          {/* Branding */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-md mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Nepal's AI Trust Index</span>
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Nagarik Credits
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Assess economic participation and behavioral credibility instantly
            </p>
          </div>

          {/* Glassmorphic Portal Card */}
          <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-30 group-hover:opacity-100 blur transition duration-700" />
            
            <div className="relative p-8 rounded-2xl bg-slate-950/80">
              <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">
                {isRegistering ? "Create Nagarik Account" : "Access Trust Dashboard"}
              </h2>

              {authError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium mb-4">
                  {authError}
                </div>
              )}

              {/* Login Form */}
              {!isRegistering ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.98] mt-6"
                  >
                    {authLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="980XXXXXXX"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Account Type</label>
                      <select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all h-[38px]"
                      >
                        <option value="CUSTOMER">Customer Profile</option>
                        <option value="MERCHANT">Merchant / Retailer</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.98] mt-6"
                  >
                    {authLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign Up
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Toggles */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button 
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setAuthError("");
                    }} 
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-all cursor-pointer bg-transparent border-none outline-none"
                  >
                    {isRegistering ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Credentials Helper Box */}
          <div className="mt-6 p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md text-center">
            <p className="text-xs text-slate-500">
              Demo Credentials: <code className="text-blue-400 font-mono">user1@nagarikcredits.com</code> · <code className="text-blue-400 font-mono">password123</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED-IN CUSTOMER PORTAL VIEW
  if (isSignedIn && currentUser?.user_type === "CUSTOMER") {
    return (
      <DashboardLayout scoreLoading={customerLoading} onRecalculate={fetchCustomerDashboardData} showRecalculate={true}>
        {customerLoading ? (
          <div className="py-16 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Loading your wallet and bills...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. WELCOME & PROFILE HEADER */}
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nagarik Customer Profile</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                    Welcome back, {currentUser?.name || "Customer partner"}
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Manage your personal capital, review peer transactions, and check your utility bill balances seamlessly.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 max-w-sm space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alternative Credit Calibrations</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Assess micro-merchant score indicators (F1-F5 factors) and unlock economic loans by upgrading your account role.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. PROFILE & WALLET STATISTICS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Card */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group col-span-2">
                <div className="absolute top-0 right-0 w-[140px] h-[140px] bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet Active Balance</span>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase">NPR Available</span>
                </div>
                <p className="text-4xl font-black text-slate-500 tracking-tight flex items-baseline gap-2">
                  NPR <span className="text-slate-100 text-5xl font-black">{session?.user ? (session as any).user.balance?.toLocaleString() || "0" : "0"}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-900/60 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Nagarik User Code</span>
                    <span className="font-bold text-slate-300 font-mono">{currentUser?.id || "USR-XXXXX"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Registered Phone</span>
                    <span className="font-bold text-slate-300 font-mono">{currentUser?.phone || "980XXXXXXX"}</span>
                  </div>
                </div>
              </div>

              {/* Utility Bills Quick Stats */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bills Pipeline</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><FileText className="w-4 h-4" /></span>
                </div>
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  {customerBills.length} <span className="text-xs text-slate-500">Payments</span>
                </p>
                <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">On Time Payment Rate</span>
                  <span className="text-emerald-400">100%</span>
                </div>
              </div>
            </div>

            {/* 3. DYNAMIC CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Peer-to-Peer Transactions Ledger */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">My Transaction Ledger</h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{customerTrans.length} Records</span>
                </div>

                {customerTrans.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    No transactions recorded on this wallet
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {customerTrans.map((tx) => {
                      const isOutflow = tx.sender_id === currentUser.id;
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
                            <p className="text-[9px] text-slate-500 mt-0.5">{new Date(tx.transaction_time || tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Utility Bill Payments Registry */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Utility Bills Ledger</h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{customerBills.length} Bills</span>
                </div>

                {customerBills.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    No utility bill records found
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {customerBills.map((bill) => (
                      <div key={bill._id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-between gap-4 font-semibold text-xs hover:border-slate-800 transition-all">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-200">{bill.bill_type.replace("_", " ")}</h4>
                          <p className="text-[9px] text-slate-500 font-mono">Due Date: {new Date(bill.due_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-slate-200">NPR {bill.bill_amount?.toLocaleString()}</p>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                            bill.payment_status === "ON_TIME" || bill.payment_status === "PAID_EARLY"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}>
                            {bill.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // 2. LOGGED-IN: INTEGRATED SESSIONS IN NEW SYSTEM
  return (
    <DashboardLayout 
      scoreLoading={scoreLoading} 
      onRecalculate={fetchScoreData}
      showRecalculate={!hasNoScore && !!scoreData}
    >
      {scoreError && !hasNoScore && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium mb-8">
          {scoreError}
        </div>
      )}

      {scoreLoading ? (
        /* Pulsing Skeleton Loaders Inside Shared Navigation */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col items-center animate-pulse">
            <div className="h-4 bg-slate-900 rounded w-2/3 mb-8" />
            <div className="w-40 h-40 rounded-full border-[10px] border-slate-900 flex items-center justify-center mb-6" />
            <div className="h-6 bg-slate-900 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-900 rounded w-1/2" />
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-4 animate-pulse">
            <div className="h-4 bg-slate-900 rounded w-1/2 mb-4" />
            <div className="h-20 bg-slate-900 rounded-xl mb-4" />
            <div className="h-20 bg-slate-900 rounded-xl" />
          </div>
        </div>
      ) : hasNoScore ? (
        /* SIMULATED APPLY CTA OR AUDITING CHECKLIST */
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 max-w-2xl mx-auto my-6">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-35 group-hover:opacity-100 blur transition duration-700" />
          
          <div className="relative p-10 rounded-2xl bg-slate-950/80 text-center">
            {isApplied ? (
              /* Success states */
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
              /* CTA application trigger */
              <>
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-6 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                  Apply For Nagarik Credit Score
                </h2>
                <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                  You do not have an active credit index. Settle utility payments, build up digital transaction histories, and run behavioral audits instantly to activate your rating.
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
        /* MAIN DASHBOARD OVERVIEW: Clean gauge and recommendations */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Score Gauge */}
          <div className="p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-600/5 blur-xl pointer-events-none" />
            
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Nagarik Alternative Credit Score</h2>

            {scoreData ? (
              <>
                <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                  {/* Ring background */}
                  <div className="absolute inset-0 rounded-full border-[12px] border-slate-900" />
                  
                  {/* Pulsing ring color */}
                  <div 
                    className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-blue-500 border-r-blue-500 animate-pulse" 
                    style={{ transform: `rotate(${Math.min(360, (scoreData.score / 1000) * 360)}deg)` }} 
                  />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-5xl font-extrabold text-slate-100 tracking-tight">{scoreData.score}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1.5">out of 1000</span>
                  </div>
                </div>

                <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${getBandStyles(scoreData.score_band).bg} mb-6`}>
                  {getBandStyles(scoreData.score_band).label}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-900/60 pt-5 w-full justify-center">
                  <span className="font-semibold text-slate-400">ML Confidence:</span>
                  <span>±{scoreData.confidence_interval} points accuracy</span>
                </div>
              </>
            ) : (
              <div className="py-12 text-slate-500 text-xs">No scoring calculations logged.</div>
            )}
          </div>

          {/* AI Strategic Action & Integrity Warnings */}
          <div className="space-y-8">
            
            {/* AI Improvement */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                AI Improvement Recommendation
              </h3>
              {scoreData ? (
                <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-900/60 p-4 rounded-xl">
                  {scoreData.top_improvement_action}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Recalculate to generate strategic recommendations.</p>
              )}
            </div>

            {/* Integrity Warnings */}
            {scoreData?.flags?.length > 0 ? (
              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Behavioral Integrity Flags
                </h3>
                <div className="space-y-2 text-xs text-red-400/80 leading-relaxed">
                  <p>Our machine-learning checks identified patterns requiring attention:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-red-400 font-mono">
                    {scoreData.flags.map((flag: string) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1 rounded bg-emerald-500/5 border border-emerald-500/10">
                  <ShieldCheck className="w-4 h-4" /> Zero Integrity Flags Detected
                </span>
                <p className="text-[10px] text-slate-500 mt-2 leading-normal">
                  All digital wallet logs, device markers, and anti-collusion checks cleared safely.
                </p>
              </div>
            )}

          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
