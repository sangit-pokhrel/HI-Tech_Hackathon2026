"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { 
  RotateCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  Layers,
  Calendar,
  DollarSign
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering and Searching states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");

  const fetchTransactions = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/transactions?limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch transactions");
      }

      const list = data.data || [];
      if (currentUser?.user_type === "CUSTOMER") {
        const filtered = list.filter((t: any) => t.sender_id === currentUser.id || t.receiver_id === currentUser.id);
        setTransactions(filtered);
      } else {
        const filtered = list.filter((t: any) => t.merchant_id === currentUser.id || t.sender_id === currentUser.id || t.receiver_id === currentUser.id);
        setTransactions(filtered);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching transactions.");
    } finally {
      setLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculations for stats
  const totalVolume = transactions.reduce((acc, tx) => acc + (tx.status === "SUCCESS" ? tx.amount : 0), 0);
  
  const cashInflow = transactions
    .filter(tx => tx.status === "SUCCESS" && tx.receiver_id === currentUser?.id)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const cashOutflow = transactions
    .filter(tx => tx.status === "SUCCESS" && tx.sender_id === currentUser?.id)
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Filtered transactions list
  const filteredTransactions = transactions.filter(tx => {
    const codeMatches = tx.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tx.remarks && tx.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let typeMatches = true;
    if (typeFilter !== "ALL") {
      if (typeFilter === "INFLOW") {
        typeMatches = tx.receiver_id === currentUser?.id;
      } else if (typeFilter === "OUTFLOW") {
        typeMatches = tx.sender_id === currentUser?.id;
      }
    }

    let channelMatches = true;
    if (channelFilter !== "ALL") {
      channelMatches = tx.payment_channel?.toUpperCase() === channelFilter;
    }

    return codeMatches && typeMatches && channelMatches;
  });

  return (
    <DashboardLayout>
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium mb-8">
          {error}
        </div>
      )}


      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transaction code or remarks..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Flow Direction filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none border-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950 text-slate-300">All Directions</option>
              <option value="INFLOW" className="bg-slate-950 text-emerald-400">Cash Inflows</option>
              <option value="OUTFLOW" className="bg-slate-950 text-orange-400">Cash Outflows</option>
            </select>
          </div>

          {/* Payment Channel filter */}
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

          <button 
            onClick={fetchTransactions}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Querying digital ledgers...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No transaction records found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 bg-slate-950/60 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Transaction Code</th>
                  <th className="px-6 py-4">Payment Channel</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const isInflow = tx.receiver_id === currentUser?.id;
                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/30 transition-all">
                      <td className="px-6 py-4">
                        {isInflow ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                            <ArrowDownLeft className="w-3 h-3" /> Inflow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-400 font-bold px-2 py-0.5 rounded bg-orange-500/5 border border-orange-500/10">
                            <ArrowUpRight className="w-3 h-3" /> Outflow
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-300">
                        {tx.transaction_code}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">
                        {tx.payment_channel || "QR"}
                      </td>
                      <td className={`px-6 py-4 font-bold ${isInflow ? "text-emerald-400" : "text-slate-200"}`}>
                        Rs. {tx.amount.toLocaleString("en-NP")}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {new Date(tx.transaction_time || tx.created_at).toLocaleString("en-NP", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                        {tx.remarks || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          tx.status === "SUCCESS" ? "bg-emerald-500 shadow-md shadow-emerald-500/20" :
                          tx.status === "FAILED" ? "bg-red-500 shadow-md shadow-red-500/20" : "bg-slate-500"
                        }`} />
                        <span className="font-semibold text-slate-400">{tx.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
