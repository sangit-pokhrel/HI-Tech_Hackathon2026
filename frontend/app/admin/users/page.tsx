"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  RotateCw,
  Search,
  FileText
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchUsers = useCallback(async () => {
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
      const data = await usersRes.json();

      if (usersRes.ok && data.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch users list.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load administrative users directory.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchUsers();
    }
  }, [status, currentUser, fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      u._id.toLowerCase().includes(term);
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Administrative User Registry</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                System Users & Balances Directory
                <Users className="w-5 h-5 text-blue-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Observe all registered Customer and Merchant balances in MongoDB, review accounts verification status, and audit full profiles.
              </p>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Users
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search controls */}
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user codes, full names, mobile phone numbers..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Directory table */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Resolving user registries...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
              No registered user accounts found matching query
            </div>
          ) : (
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    <th className="py-3.5 px-6">User Reference ID</th>
                    <th className="py-3.5 px-6">Full Legal Name</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6">Account Role</th>
                    <th className="py-3.5 px-6">KYC Status</th>
                    <th className="py-3.5 px-6 text-right">Wallet NPR Balance</th>
                    <th className="py-3.5 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-900/20 transition-all font-semibold">
                      <td className="py-4 px-6 font-mono font-bold text-slate-400">{user._id}</td>
                      <td className="py-4 px-6 text-slate-200 font-bold">{user.name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">
                        {user.phone} {user.email && `· ${user.email}`}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                          user.user_type === "ADMIN" 
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-mono" 
                            : user.user_type === "MERCHANT" || user.user_type === "BOTH"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-mono" 
                            : "bg-slate-500/10 border-slate-500/30 text-slate-400 font-mono"
                        }`}>
                          {user.user_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          user.verified_status === "verified"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-in"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                        }`}>
                          {user.verified_status === "verified" ? "Verified KYC" : "Pending Check"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-emerald-400 font-mono text-xs">
                        NPR {user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15 cursor-pointer active:scale-95 transition-all"
                        >
                          <FileText className="w-3 h-3" />
                          Audit Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
