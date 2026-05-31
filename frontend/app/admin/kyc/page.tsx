"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Coins
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";

export default function AdminKycPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [kycTab, setKycTab] = useState<"pending" | "all">("pending");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchKycUsers = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const usersRes = await fetch(`${backendUrl}/users?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const usersData = await usersRes.json();

      if (usersRes.ok && usersData.success) {
        setUsers(usersData.data || []);
      } else {
        throw new Error(usersData.message || "Failed to fetch KYC users.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrative identity queue.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchKycUsers();
    }
  }, [status, currentUser, fetchKycUsers]);

  // Approve / Reject KYC
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

      setUsers(prev => prev.map(u => u._id === userId ? { ...u, verified_status: newStatus } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update KYC status.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.phone.includes(term) || (u.email && u.email.toLowerCase().includes(term));
    const matchesTab = kycTab === "pending" ? u.verified_status !== "verified" : true;
    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Nagarik Identity Reviews</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Citizenship KYC Reviews Queue
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Audit uploaded micro-merchant citizenship credentials, cross-reference family registers, and approve/flag legal identities.
              </p>
            </div>

            <button
              onClick={fetchKycUsers}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh KYC Queue
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
            placeholder="Search legal names, phone indexes..."
            className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all w-full sm:max-w-xs"
          />

          <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
            <button 
              onClick={() => setKycTab("pending")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${kycTab === "pending" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              Awaiting Reviews ({users.filter(u => u.verified_status !== "verified").length})
            </button>
            <button 
              onClick={() => setKycTab("all")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${kycTab === "all" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              All Registry Directory
            </button>
          </div>
        </div>

        {/* User list */}
        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Resolving identity pipelines...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
            No identity submissions found matching filters
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUser === user._id;
              const isKycVerified = user.verified_status === "verified";
              
              // Mock citizenship details for visual completeness
              const citizenshipNo = `27-01-79-${user.phone ? user.phone.slice(-5) : "05432"}`;

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
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none font-semibold"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{user.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isKycVerified 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                        }`}>
                          {isKycVerified ? "Verified" : "Pending Audit Check"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{user._id} · {user.phone} · Role: {user.user_type}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-900/60 space-y-4 text-xs animate-in fade-in duration-300">
                      
                      {/* Identity Details Card */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Citizenship Card Demographics</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Citizenship No</span>
                            <span className="font-bold text-slate-300 font-mono">{citizenshipNo}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Gender Profile</span>
                            <span className="font-bold text-slate-300">Male</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">DOB (Date of Birth)</span>
                            <span className="font-bold text-slate-300 font-mono">2045-03-12</span>
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
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Place of Issue</span>
                            <span className="font-bold text-slate-300">{user.location?.district || "Kathmandu"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Utility billing Counter checks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Utility billing SC Counters</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-900 font-semibold font-mono">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">NEA SC No (Electricity)</span>
                            <span className="font-bold text-slate-300">021.05.{user.phone ? user.phone.slice(-3) : "102"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">KUKL ID (Water Counter ID)</span>
                            <span className="font-bold text-slate-300">W-{user.phone ? user.phone.slice(-6) : "789052"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Document scans thumbnails */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Citizenship Scan Scans</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-32 border border-slate-900 rounded-lg bg-slate-950/60 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            Citizenship Front Scan
                          </div>
                          <div className="h-32 border border-slate-900 rounded-lg bg-slate-950/60 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            Citizenship Back Scan
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-900/60">
                        {isKycVerified ? (
                          <button
                            onClick={() => handleUpdateKycStatus(user._id, "unverified")}
                            disabled={actionLoading === user._id}
                            className="flex-1 py-2 text-center text-xs font-bold rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === user._id ? "Flagging..." : "Flag & Reject Identity"}
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
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
