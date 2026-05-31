"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Coins, 
  Briefcase, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  Menu, 
  X,
  RotateCw,
  Sparkles,
  Lock,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  ArrowRight,
  User,
  Users
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  scoreLoading?: boolean;
  onRecalculate?: () => void;
  showRecalculate?: boolean;
}

const districts = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Biratnagar", "Butwal", "Dharan", "Hetauda", "Nepalgunj", "Kaski",
  "Rupandehi", "Morang", "Sunsari", "Parsa", "Dhanusha", "Jhapa"
];

export default function DashboardLayout({ 
  children, 
  scoreLoading = false, 
  onRecalculate,
  showRecalculate = false
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // KYC States
  const [kycStatus, setKycStatus] = useState<string>("loading"); // loading, verified, unverified
  const [userProfile, setUserProfile] = useState<any>(null);

  // Expanded Nepalese Citizenship KYC Form Inputs
  const [fullName, setFullName] = useState("");
  const [citizenshipNo, setCitizenshipNo] = useState("");
  const [districtIssue, setDistrictIssue] = useState("Kathmandu");
  const [issueDate, setIssueDate] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [permAddress, setPermAddress] = useState("");
  
  // New standard citizenship details
  const [birthPlace, setBirthPlace] = useState("");
  const [citizenshipType, setCitizenshipType] = useState("Descendant"); // Descendant (वंशज), Naturalized (अङ्गीकृत), Birth (जन्मसिद्ध)
  const [fatherCitizenship, setFatherCitizenship] = useState("");
  const [motherCitizenship, setMotherCitizenship] = useState("");

  // Utility fetching formality inputs (Electricity & Water)
  const [neaCounter, setNeaCounter] = useState("Kathmandu Central");
  const [neaConsumerId, setNeaConsumerId] = useState("");
  const [neaScNo, setNeaScNo] = useState("");
  const [waterCounter, setWaterCounter] = useState("Tripureshwor Branch");
  const [waterCustomerId, setWaterCustomerId] = useState("");

  // Separate image scan uploads (strictly 1 file per field)
  const [frontFileName, setFrontFileName] = useState("");
  const [backFileName, setBackFileName] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string>("");
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string>("");
  
  // KYC Submit states
  const [kycLoading, setKycLoading] = useState(false);
  const [kycStep, setKycStep] = useState(0); 
  const [kycSuccess, setKycSuccess] = useState(false);
  const [kycError, setKycError] = useState("");

  const currentUser = session?.user as any;
  const userInitial = currentUser?.name 
    ? currentUser.name.charAt(0).toUpperCase() 
    : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U");

  // Navigation Items
  const navigationItems = currentUser?.user_type === "ADMIN"
    ? [
        { name: "Analytics", href: "/admin", icon: BarChart3 },
        { name: "Identity Reviews", href: "/admin/kyc", icon: ShieldCheck },
        { name: "Loans Underwriting", href: "/admin/loans", icon: Briefcase },
        { name: "Global Transactions", href: "/admin/transactions", icon: Coins },
        { name: "User Balances", href: "/admin/users", icon: Users },
        { name: "Risk Alerts", href: "/admin/risk-alerts", icon: AlertTriangle },
      ]
    : currentUser?.user_type === "CUSTOMER"
    ? [
        { name: "My Wallet", href: "/", icon: Coins },
        { name: "Credit Score", href: "/credits", icon: ShieldCheck },
        { name: "Micro-Loans", href: "/loans", icon: Briefcase },
        { name: "Transactions", href: "/transactions", icon: BarChart3 },
        { name: "Bill Payments", href: "/bills", icon: FileText },
        { name: "My Profile", href: "/profile", icon: User },
      ]
    : [
        { name: "Dashboard", href: "/", icon: BarChart3 },
        { name: "Transactions", href: "/transactions", icon: Coins },
        { name: "Credits", href: "/credits", icon: ShieldCheck },
        { name: "Loan", href: "/loans", icon: Briefcase },
        { name: "My Profile", href: "/profile", icon: User },
      ];

  // 1. Fetch Real-time KYC Verification status
  const fetchKycStatus = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUserProfile(data.data);
        setKycStatus(data.data.verified_status || "unverified");
        if (data.data.name) setFullName(data.data.name);
      } else {
        setKycStatus("unverified");
      }
    } catch (err) {
      console.error("Failed to query real-time KYC status:", err);
      setKycStatus("unverified");
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchKycStatus();
    }
  }, [status, fetchKycStatus]);

  // 2. Submit KYC Form (Simulated Database Audits & Updates)
  const handleKycVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !citizenshipNo || !issueDate || !dob || !fatherName || !motherName || !permAddress || !birthPlace || !citizenshipType || !frontFileName || !backFileName || !neaConsumerId || !neaScNo || !waterCustomerId) {
      setKycError("Please fill in all required fields, utility details, and upload both front and back citizenship scans.");
      return;
    }

    setKycLoading(true);
    setKycError("");

    try {
      // Step 1: Simulated OCR & Forgery Check
      setKycStep(1);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 2: Fetching NEA & Water bill ledgers
      setKycStep(2);
      await new Promise(resolve => setTimeout(resolve, 1600));

      // Step 3: Calibrating alternative credit indicators
      setKycStep(3);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 4: Cross-referencing District Registry & finalizing trust graph
      setKycStep(4);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // POST real-time updates to backend
      const updateRes = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ verified_status: "verified" })
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.success) {
        throw new Error(updateData.message || "Failed to update profile verification status.");
      }

      setKycSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // show success check
      
      // Hydrate local layout states immediately
      setKycStatus("verified");
    } catch (err: any) {
      setKycError(err.message || "Something went wrong during KYC document scan.");
    } finally {
      setKycLoading(false);
      setKycStep(0);
    }
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontFile(file);
      setFrontFileName(file.name);
      if (frontPreviewUrl) {
        URL.revokeObjectURL(frontPreviewUrl);
      }
      setFrontPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackFile(file);
      setBackFileName(file.name);
      if (backPreviewUrl) {
        URL.revokeObjectURL(backPreviewUrl);
      }
      setBackPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl);
      if (backPreviewUrl) URL.revokeObjectURL(backPreviewUrl);
    };
  }, [frontPreviewUrl, backPreviewUrl]);

  if (status === "loading" || kycStatus === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#03060f]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading Nagarik Session...</p>
        </div>
      </div>
    );
  }

  const isVerified = kycStatus === "verified" || currentUser?.user_type === "ADMIN";

  return (
    <div className="relative min-h-screen bg-[#03060f] text-slate-100 flex flex-col overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Dashboard Top Navbar */}
      <nav className="relative z-30 border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isVerified && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            
            <Link href="/" className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-500/10">
                NC
              </span>
              <span className="font-bold tracking-tight text-lg text-slate-100">Nagarik Credits</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
              isVerified 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isVerified ? "KYC Verified" : "KYC Pending Verification"}
            </span>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-all text-slate-200 focus:outline-none cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-500/10">
                  {userInitial}
                </div>
                <span className="hidden md:inline text-xs font-semibold max-w-[120px] truncate">
                  {currentUser?.name || currentUser?.email}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-2 shadow-2xl z-40">
                    <div className="px-3 py-2 border-b border-slate-900 mb-1.5">
                      <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name || "Nagarik User"}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                    </div>

                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 py-8 relative z-20">
        
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-2 p-4 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Navigation Menu</p>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return isVerified ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive 
                      ? "bg-blue-600/10 border border-blue-500/20 text-blue-400" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {item.name}
                </Link>
              ) : (
                /* LOCK DOWN THE LINKS VISUALLY WHEN UNVERIFIED */
                <button
                  key={item.name}
                  disabled
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-transparent cursor-not-allowed opacity-50 text-left"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-700" />
                    {item.name}
                  </span>
                  <Lock className="w-3.5 h-3.5 text-slate-700" />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Dropdown Menu Navigation */}
        {mobileMenuOpen && isVerified && (
          <div className="lg:hidden fixed inset-0 z-20 top-16 bg-[#03060fd9] backdrop-blur-md flex flex-col p-6 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Navigation Menu</p>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? "bg-blue-600/10 border border-blue-500/20 text-blue-400" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {isVerified ? (
            /* VERIFIED: Unlocked Content Pages */
            <>
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
                    {pathname === "/" && "Dashboard"}
                    {pathname === "/transactions" && "Transactions"}
                    {pathname === "/credits" && "Credits"}
                    {pathname === "/loans" && "Loan"}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {pathname === "/" && `Welcome back, ${currentUser?.name || currentUser?.email}.`}
                    {pathname === "/transactions" && "View your digital QR payments and ledger history."}
                    {pathname === "/credits" && "Behavioral alternative credit factor calibrations."}
                    {pathname === "/loans" && "Micro lending and capital request pipelines."}
                  </p>
                </div>
                
                {showRecalculate && onRecalculate && (
                  <div>
                    <button
                      onClick={onRecalculate}
                      disabled={scoreLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-slate-100 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${scoreLoading ? "animate-spin" : ""}`} />
                      Recalculate AI Score
                    </button>
                  </div>
                )}
              </div>

              {children}
            </>
          ) : (
            /* UNVERIFIED: Lock Everything Down & Show Citizenship KYC Form */
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 max-w-3xl mx-auto my-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-35 group-hover:opacity-100 blur transition duration-700" />
              
              <div className="relative p-8 rounded-2xl bg-slate-950/80">
                <div className="flex items-center gap-3 border-b border-slate-900/60 pb-5 mb-6">
                  <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Lock className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-200 tracking-wide uppercase">Nagarik KYC Identity Verification</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Nepalese Citizenship details must be verified to unlock alternative scoring ledger audits</p>
                  </div>
                </div>

                {kycSuccess ? (
                  /* KYC SUCCESS SIMULATOR VIEW */
                  <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                      <UserCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-100">KYC Verified Successfully</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Your identity documents have been authenticated against the national civil records. Unlocking economic credit score registers, transactions, and loans.
                    </p>
                  </div>
                ) : kycLoading ? (
                  /* SIMULATING AUDITING PROGRESS BAR */
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <div>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">
                        {kycStep === 1 && "Running document scanner OCR checks..."}
                        {kycStep === 2 && `Fetching NEA SC No: ${neaScNo} & KUKL ID: ${waterCustomerId} billing history...`}
                        {kycStep === 3 && "Calibrating alternative factor indicators..."}
                        {kycStep === 4 && "Cross-referencing District Registry..."}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Please do not reload or navigate away from page.</p>
                    </div>
                    <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-900 mt-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(kycStep / 4) * 100}%` }} 
                      />
                    </div>
                  </div>
                ) : (
                  /* SUBMIT KYC FORM */
                  <form onSubmit={handleKycVerify} className="space-y-5">
                    {kycError && (
                      <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{kycError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* 1. LEGAL NAME */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Legal Name (as in Citizenship)</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 2. CITIZENSHIP NUMBER */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizenship Certificate Number</label>
                        <input
                          type="text"
                          required
                          value={citizenshipNo}
                          onChange={(e) => setCitizenshipNo(e.target.value)}
                          placeholder="27-01-79-05432"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                        />
                      </div>

                      {/* 3. DATE OF BIRTH */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth (DOB)</label>
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                        />
                      </div>

                      {/* 4. GENDER */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* 5. PLACE OF BIRTH */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Place of Birth (District, Ward, VDC/Muni)</label>
                        <input
                          type="text"
                          required
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          placeholder="Lalitpur, Ward No. 4, Lalitpur Metro"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 6. PERMANENT ADDRESS */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permanent Address (on Card)</label>
                        <input
                          type="text"
                          required
                          value={permAddress}
                          onChange={(e) => setPermAddress(e.target.value)}
                          placeholder="Kathmandu, Ward No. 10, Kathmandu Metro"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 7. CITIZENSHIP TYPE */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizenship Type</label>
                        <select
                          value={citizenshipType}
                          onChange={(e) => setCitizenshipType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                        >
                          <option value="Descendant">Descendant (वंशज)</option>
                          <option value="Naturalized">Naturalized (अङ्गीकृत)</option>
                          <option value="Birthplace">Birth (जन्मसिद्ध)</option>
                        </select>
                      </div>

                      {/* 8. FATHER'S NAME */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Father's Full Name</label>
                        <input
                          type="text"
                          required
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="Father's Full Name"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 9. FATHER'S CITIZENSHIP NUMBER */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Father's Citizenship No. (Optional)</label>
                        <input
                          type="text"
                          value={fatherCitizenship}
                          onChange={(e) => setFatherCitizenship(e.target.value)}
                          placeholder="Father's Citizenship Number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                        />
                      </div>

                      {/* 10. MOTHER'S NAME */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mother's Full Name</label>
                        <input
                          type="text"
                          required
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          placeholder="Mother's Full Name"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 11. MOTHER'S CITIZENSHIP NUMBER */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mother's Citizenship No. (Optional)</label>
                        <input
                          type="text"
                          value={motherCitizenship}
                          onChange={(e) => setMotherCitizenship(e.target.value)}
                          placeholder="Mother's Citizenship Number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                        />
                      </div>

                      {/* 12. SPOUSE NAME (OPTIONAL) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spouse's Full Name (Optional)</label>
                        <input
                          type="text"
                          value={spouseName}
                          onChange={(e) => setSpouseName(e.target.value)}
                          placeholder="Spouse Name (If Married)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                        />
                      </div>

                      {/* 13. DISTRICT OF ISSUE */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District of Issue</label>
                        <select
                          value={districtIssue}
                          onChange={(e) => setDistrictIssue(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                        >
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* 14. DATE OF ISSUE */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Issue</label>
                        <input
                          type="date"
                          required
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* UTILITY FETCHING DETAILS (Formality for Alternative Credit scoring) */}
                    <div className="pt-5 border-t border-slate-900/60 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Coins className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Alternative Credit Utility Integration</h3>
                          <p className="text-[10px] text-slate-500">Provide electricity & water credentials to fetch historical utility ledgers (will not be stored in the database)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* NEA Distribution Center Counter */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NEA Distribution Counter (Electricity)</label>
                          <select
                            value={neaCounter}
                            onChange={(e) => setNeaCounter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                          >
                            <option value="Kathmandu Central">Kathmandu Central</option>
                            <option value="Lalitpur">Lalitpur</option>
                            <option value="Bhaktapur">Bhaktapur</option>
                            <option value="Kirtipur">Kirtipur</option>
                            <option value="Baneshwor">Baneshwor</option>
                            <option value="Maharajgunj">Maharajgunj</option>
                            <option value="Jorpati">Jorpati</option>
                            <option value="Pokhara">Pokhara</option>
                            <option value="Biratnagar">Biratnagar</option>
                            <option value="Butwal">Butwal</option>
                          </select>
                        </div>

                        {/* NEA Consumer ID */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NEA Consumer ID</label>
                          <input
                            type="text"
                            required
                            value={neaConsumerId}
                            onChange={(e) => setNeaConsumerId(e.target.value)}
                            placeholder="e.g. 10245"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                          />
                        </div>

                        {/* NEA Service Connection No (SC No) */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NEA SC No (Service Connection)</label>
                          <input
                            type="text"
                            required
                            value={neaScNo}
                            onChange={(e) => setNeaScNo(e.target.value)}
                            placeholder="e.g. 021.05.003"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                          />
                        </div>

                        {/* KUKL Branch Counter */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KUKL Water Branch Counter</label>
                          <select
                            value={waterCounter}
                            onChange={(e) => setWaterCounter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all font-bold h-[34px] cursor-pointer"
                          >
                            <option value="Tripureshwor Branch">Tripureshwor Branch</option>
                            <option value="Lalitpur Branch">Lalitpur Branch</option>
                            <option value="Bhaktapur Branch">Bhaktapur Branch</option>
                            <option value="Mahankalchaur Branch">Mahankalchaur Branch</option>
                            <option value="Kirtipur Branch">Kirtipur Branch</option>
                            <option value="Maharajgunj Branch">Maharajgunj Branch</option>
                            <option value="Pokhara Water Board">Pokhara Water Board</option>
                          </select>
                        </div>

                        {/* KUKL Customer ID */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Water Customer ID / Connection No</label>
                          <input
                            type="text"
                            required
                            value={waterCustomerId}
                            onChange={(e) => setWaterCustomerId(e.target.value)}
                            placeholder="e.g. W-789052"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TWO SEPARATE REAL SCANS: FRONT & BACK (Strictly 1 file per field) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-900/60">
                      {/* FRONT CARD SCAN */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-semibold">Citizenship Front Side Scan</label>
                        <label 
                          htmlFor="front-scan-input"
                          className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-slate-900/30 min-h-[140px] relative overflow-hidden ${
                            frontFileName 
                              ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" 
                              : "border-slate-800 hover:border-blue-500/40 bg-slate-900/20"
                          }`}
                        >
                          <input
                            type="file"
                            id="front-scan-input"
                            accept="image/*"
                            onChange={handleFrontFileChange}
                            className="hidden"
                          />
                          {frontPreviewUrl ? (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950/40 group">
                              <img src={frontPreviewUrl} alt="Front Scan Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/80 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <Upload className="w-5 h-5 text-blue-400" />
                                <span className="text-[10px] font-bold text-slate-200 text-center">Change Front Scan</span>
                                <span className="text-[9px] text-slate-400 truncate max-w-[90%]">{frontFileName}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-slate-400">Upload Front Scan</span>
                              <span className="text-[9px] text-slate-600">Strictly 1 Image File</span>
                            </>
                          )}
                        </label>
                      </div>

                      {/* BACK CARD SCAN */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-semibold">Citizenship Back Side Scan</label>
                        <label 
                          htmlFor="back-scan-input"
                          className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-slate-900/30 min-h-[140px] relative overflow-hidden ${
                            backFileName 
                              ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" 
                              : "border-slate-800 hover:border-blue-500/40 bg-slate-900/20"
                          }`}
                        >
                          <input
                            type="file"
                            id="back-scan-input"
                            accept="image/*"
                            onChange={handleBackFileChange}
                            className="hidden"
                          />
                          {backPreviewUrl ? (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950/40 group">
                              <img src={backPreviewUrl} alt="Back Scan Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/80 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <Upload className="w-5 h-5 text-blue-400" />
                                <span className="text-[10px] font-bold text-slate-200 text-center">Change Back Scan</span>
                                <span className="text-[9px] text-slate-400 truncate max-w-[90%]">{backFileName}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-slate-400">Upload Back Scan</span>
                              <span className="text-[9px] text-slate-600">Strictly 1 Image File</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
                    >
                      Verify Nagarik Account
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
