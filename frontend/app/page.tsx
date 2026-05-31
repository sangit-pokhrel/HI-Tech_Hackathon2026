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
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [demoTxLoading, setDemoTxLoading] = useState(false);
  const [demoTxMessage, setDemoTxMessage] = useState("");
  const [demoTxError, setDemoTxError] = useState("");

  const [hasNoScore, setHasNoScore] = useState(false);

  // Customer Dashboard State
  const [customerTrans, setCustomerTrans] = useState<any[]>([]);
  const [customerBills, setCustomerBills] = useState<any[]>([]);
  const [customerActivities, setCustomerActivities] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const isSignedIn = status === "authenticated";
  const currentUser = session?.user as any;

  useEffect(() => {
    setDisplayBalance((session as any)?.user?.balance || 0);
  }, [session]);

  // Fetch Score Data from Protected Elysia Backend
  const fetchScoreData = useCallback(async (options?: { refresh?: boolean }) => {
    if (!session || !currentUser?.id) return;
    setScoreLoading(true);
    setScoreError("");
    setHasNoScore(false);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const query = options?.refresh ? "?refresh=true" : "";
      const res = await fetch(`${backendUrl}/users/${currentUser.id}/score${query}`, {
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

  const handleApplyForScore = () => {
    router.push("/credits?redirectReason=no-score");
  };

  const handleRunDemoTransaction = async () => {
    if (!session || !currentUser?.id) return;

    setDemoTxLoading(true);
    setDemoTxError("");
    setDemoTxMessage("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/users/${currentUser.id}/score/test-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create demo transaction");
      }

      if (data.updated_score) {
        setScoreData(data.updated_score);
        setHasNoScore(false);
      }

      if (data.transaction?.amount) {
        setDisplayBalance((prev) => prev + Number(data.transaction.amount));
      }

      setDemoTxMessage(
        `Test payment of NPR ${Number(data.transaction?.amount || 0).toLocaleString()} received from ${
          data.counterparty?.name || "a verified customer"
        }. Live ML score refreshed.`
      );
    } catch (err: any) {
      setDemoTxError(err.message || "Failed to run demo transaction");
    } finally {
      setDemoTxLoading(false);
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

            {/* Credit Score Card */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group col-span-1">
              <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nagarik Credit Score</span>
                {hasNoScore ? (
                  <button onClick={handleApplyForScore} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase hover:bg-emerald-500/20 transition">
                    Start Evaluation
                  </button>
                ) : null}
              </div>
              {scoreLoading ? (
                <p className="text-2xl text-slate-500 animate-pulse">Loading...</p>
              ) : hasNoScore ? (
                <p className="text-sm text-slate-400">No score available yet. Start the evaluation in Credits.</p>
              ) : scoreData ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-100">{scoreData.score}</span>
                  <span className={getBandStyles(scoreData.score_band).bg.split(' ')[0] + ' text-sm'}>{getBandStyles(scoreData.score_band).label}</span>
                </div>
              ) : null}
            </div>
            {/* Wallet Card */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group col-span-2">
              <div className="absolute top-0 right-0 w-[140px] h-[140px] bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet Active Balance</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase">NPR Available</span>
              </div>
              <p className="text-4xl font-black text-slate-500 tracking-tight flex items-baseline gap-2">
                NPR <span className="text-slate-100 text-5xl font-black">{displayBalance.toLocaleString()}</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-900/60 text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Nagarik User Reference</span>
                  <span className="font-bold text-slate-300 font-mono">{currentUser?.id || "USR-XXXXX"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Registered Phone</span>
                  <span className="font-bold text-slate-300 font-mono">{currentUser?.phone || "980XXXXXXX"}</span>
                </div>
              </div>
            </div>

            {/* Wallet activity counter */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet Logs</span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Sparkles className="w-4 h-4" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {customerActivities.length} <span className="text-xs text-slate-500">Logs</span>
              </p>
              <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Account Health Rate</span>
                <span className="text-emerald-400">Stable</span>
              </div>
            </div>

            {/* 3. DYNAMIC CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

              {/* Left Side: Wallet Activities Ledger */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">My Wallet Activity Log</h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{customerActivities.length} logs</span>
                </div>

                {customerActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    No wallet balance activities recorded
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {customerActivities.map((act) => (
                      <div key={act._id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-between gap-4 font-semibold text-xs hover:border-slate-800 transition-all font-mono">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-200 uppercase">{act.activity_type.replace("_", " ")}</h4>
                          <p className="text-[9px] text-slate-500">Running Balance After: NPR {act.balance_after_transaction?.toLocaleString()}</p>
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

              {/* Right Side: Alternative Upgrade Promos */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md overflow-hidden lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Sparkles className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Nagarik Alternative Loan CTA</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/20 p-4 rounded-xl border border-slate-900">
                  Ready to expand your local business or micro enterprise? Apply to upgrade your Customer profile to a **Merchant Partner** account to start mapping alternative factor calibrations (F1-F5 risk gauges) and apply for low-interest micro-loans instantly!
                </p>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Alternative Calibrations Included</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-semibold font-mono">
                    <span className="p-1 rounded bg-slate-950/40 border border-slate-900">F1 rhythm check</span>
                    <span className="p-1 rounded bg-slate-950/40 border border-slate-900">F2 elasticity</span>
                    <span className="p-1 rounded bg-slate-950/40 border border-slate-900">F3 digital footprint</span>
                    <span className="p-1 rounded bg-slate-950/40 border border-slate-900">F4 social proof</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => router.push("/credits")}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    Evaluate Nagarik Score
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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
      onRecalculate={() => fetchScoreData({ refresh: true })}
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
        /* Redirect to dedicated credits evaluation flow */
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 max-w-2xl mx-auto my-6">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-35 group-hover:opacity-100 blur transition duration-700" />

          <div className="relative p-10 rounded-2xl bg-slate-950/80 text-center">
            <>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-6 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Start Your Credit Evaluation
              </h2>
              <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                Your score assessment now runs in the dedicated Credits flow. Continue there to answer the right number of questions and compute your score using your latest activity.
              </p>

              <button
                onClick={handleApplyForScore}
                className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg shadow-blue-500/15 cursor-pointer active:scale-[0.98]"
              >
                Continue to Credits
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
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

          <div className="space-y-8">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Why this score?
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-900/60 p-4 rounded-xl">
                {scoreData?.top_improvement_action || "This score combines payment reliability, psychometric behavior, and community trust into a single alternative credit rating."}
              </p>
              <div className="grid grid-cols-1 gap-3 mt-5 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Trust Layer Signals</p>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li>• Payment reliability and expense consistency</li>
                    <li>• Behavioral trust from psychometric assessment</li>
                    <li>• Community reputation and social trust graph signals</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Confidence Snapshot</p>
                  <div className="text-sm text-slate-200 font-semibold mb-2">{scoreData?.ml_prediction?.predicted_class ?? "REVIEW"}</div>
                  <p className="text-[11px] text-slate-500">Repayment confidence: <span className="text-slate-200 font-semibold">{scoreData?.ml_prediction?.repayment_probability ? `${(scoreData.ml_prediction.repayment_probability * 100).toFixed(0)}%` : "N/A"}</span></p>
                  <p className="text-[11px] text-slate-500">Default probability: <span className="text-slate-200 font-semibold">{scoreData?.ml_prediction?.default_probability ? `${(scoreData.ml_prediction.default_probability * 100).toFixed(0)}%` : "N/A"}</span></p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Social Trust Snapshot</h3>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Community score</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Integrity Score</p>
                  <p className="text-3xl font-extrabold text-slate-100">{scoreData?.factor_breakdown?.F4_integrity?.score ?? "--"}</p>
                  <p className="text-[11px] text-slate-500 mt-2">Gauge of community trust and fraud resilience.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Safety flags</p>
                  <p className="text-lg font-semibold text-slate-100">{scoreData?.flags?.length ? scoreData.flags.length : 0}</p>
                  <p className="text-[11px] text-slate-500 mt-2">Number of integrity warnings detected.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Loan recommendation</h3>
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-900/60 p-4 rounded-xl">
                {scoreData?.suggested_loan_amount
                  ? `Based on your alternative trust score, the system suggests a loan amount of NPR ${scoreData.suggested_loan_amount.toLocaleString()} with a ${scoreData.repayment_plan?.toLowerCase() ?? "weekly"} repayment plan.`
                  : "Your score is ready. Request a micro-credit loan and let the system match your request with alternative risk indicators."}
              </p>
              <div className="mt-4 rounded-xl border border-slate-900 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Realtime ML Demo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add one verified customer payment and watch the live merchant score update from the ML pipeline.
                    </p>
                  </div>
                  <button
                    onClick={handleRunDemoTransaction}
                    disabled={demoTxLoading}
                    className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {demoTxLoading ? "Running..." : "Add Test Transaction"}
                  </button>
                </div>
                {demoTxMessage && (
                  <p className="mt-3 text-xs text-emerald-400">{demoTxMessage}</p>
                )}
                {demoTxError && (
                  <p className="mt-3 text-xs text-red-400">{demoTxError}</p>
                )}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => router.push("/loans")}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                >
                  Request Loan
                </button>
                <button
                  onClick={() => router.push("/credits")}
                  className="w-full py-3 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-200 font-bold text-sm hover:bg-slate-900 transition-all"
                >
                  Improve Score
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
