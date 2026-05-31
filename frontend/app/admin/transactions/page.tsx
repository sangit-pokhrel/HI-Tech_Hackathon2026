"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtering & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchGlobalTransactions = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/transactions?limit=150`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTransactions(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch global transactions.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load global transaction ledgers.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchGlobalTransactions();
    }
  }, [status, currentUser, fetchGlobalTransactions]);

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    const term = searchQuery.toLowerCase();
    const codeMatches = tx.transaction_code.toLowerCase().includes(term) ||
      tx.sender_id.toLowerCase().includes(term) ||
      tx.receiver_id.toLowerCase().includes(term) ||
      (tx.remarks && tx.remarks.toLowerCase().includes(term));

    let channelMatches = true;
    if (channelFilter !== "ALL") {
      channelMatches = tx.payment_channel?.toUpperCase() === channelFilter;
    }

    let statusMatches = true;
    if (statusFilter !== "ALL") {
      statusMatches = tx.status === statusFilter;
    }

    return codeMatches && channelMatches && statusMatches;
  });

  // Pagination math
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Auto reset page if filters shift total items
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, channelFilter, statusFilter, pageSize]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Administrative Audit Ledgers</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Global Transactions Ledger
                <Coins className="w-5 h-5 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Audit every transacted available NPR ledger in the Nagarik trust network, search by user keys, and filter channels dynamically.
              </p>
            </div>

            <button
              onClick={fetchGlobalTransactions}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Ledgers
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TX code, sender, receiver, remarks..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Channel filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none border-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-950 text-slate-300">All Channels</option>
                <option value="QR" className="bg-slate-950 text-blue-400">QR Code Scan</option>
                <option value="WALLET" className="bg-slate-950 text-purple-400">Digital Wallet</option>
                <option value="BANK_TRANSFER" className="bg-slate-950 text-amber-400">Bank Transfer</option>
                <option value="CASH" className="bg-slate-950 text-emerald-400">Bazaar Cash</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none border-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-950 text-slate-300">All Statuses</option>
                <option value="SUCCESS" className="bg-slate-950 text-emerald-400">SUCCESS</option>
                <option value="FAILED" className="bg-slate-950 text-red-400">FAILED</option>
              </select>
            </div>

            {/* Limit selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none border-none cursor-pointer"
              >
                <option value={5} className="bg-slate-950 text-slate-300">5 / page</option>
                <option value={10} className="bg-slate-950 text-slate-300">10 / page</option>
                <option value={25} className="bg-slate-950 text-slate-300">25 / page</option>
                <option value={50} className="bg-slate-950 text-slate-300">50 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold font-sans">Querying global registers...</p>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
              No transactions recorded in system matching filters
            </div>
          ) : (
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    <th className="py-4 px-6">TX Code</th>
                    <th className="py-4 px-6">Sender User ID</th>
                    <th className="py-4 px-3">Flow</th>
                    <th className="py-4 px-6">Receiver User ID</th>
                    <th className="py-4 px-6">Channel</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Transacted Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-900/20 transition-all font-semibold">
                      <td className="py-4 px-6 font-mono font-bold text-slate-300">{tx.transaction_code}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono truncate max-w-[120px]">{tx.sender_id}</td>
                      <td className="py-4 px-3 text-slate-500">
                        {tx.payment_channel === "QR" ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono truncate max-w-[120px]">{tx.receiver_id}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 text-slate-300 font-bold font-mono">
                          {tx.payment_channel || "QR"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        Rs. {tx.amount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          tx.status === "SUCCESS" 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-right font-mono text-[10px]">
                        {new Date(tx.transaction_time || tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-900/60 bg-slate-950/40 flex items-center justify-between gap-4 font-sans text-xs">
                <span className="text-slate-500 font-semibold">
                  Showing <span className="text-slate-300">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="text-slate-300">{Math.min(currentPage * pageSize, totalItems)}</span> of{" "}
                  <span className="text-slate-300">{totalItems}</span> ledger items
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-slate-400 font-bold px-2.5">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
