"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  RotateCw, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
  Coins
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function BillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSignedIn = status === "authenticated";
  const currentUser = session?.user as any;

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const fetchUtilityBills = useCallback(async () => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001/api";
      const token = (session as any).accessToken;

      const res = await fetch(`${backendUrl}/utility-payments?sender_id=${currentUser.id}&limit=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load utility bills");
      }
      setBills(data.data || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching bills.");
    } finally {
      setLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (isSignedIn) {
      fetchUtilityBills();
    }
  }, [isSignedIn, fetchUtilityBills]);

  // Metrics
  const totalPaidCount = bills.length;
  const totalAmountPaid = bills.reduce((acc, b) => acc + (b.payment_status !== "UNPAID" ? b.bill_amount : 0), 0);
  const latePayments = bills.filter(b => b.days_late > 0).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header Banner */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Utility Billing Database</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                My Paid Utility Bills
                <FileText className="w-5 h-5 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Check and review paid electricity (NEA) and water (KUKL) ledger records. Settle dues on time to boost your Nagarik AI factor rhythm.
              </p>
            </div>

            <button
              onClick={fetchUtilityBills}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Bills
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Total Paid Bills</span>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{totalPaidCount}</p>
            <span className="text-[10px] text-slate-400 block mt-2 font-semibold">NEA & KUKL Combined</span>
          </div>

          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Total Paid Amount</span>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">NPR {totalAmountPaid.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 block mt-2 font-semibold">Settle Dues Transacted</span>
          </div>

          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">On-Time Payment Rating</span>
            <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {totalPaidCount > 0 ? `${Math.round(((totalPaidCount - latePayments) / totalPaidCount) * 100)}%` : "100%"}
            </p>
            <span className="text-[10px] text-emerald-400 block mt-2 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> High Trust Score Influence
            </span>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Fetching billing pipeline registries...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-16 text-center rounded-2xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
            No utility bill payment history logs found on this account
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.map((bill) => (
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
                      : "bg-red-500/10 border-red-500/30 text-red-400"
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
    </DashboardLayout>
  );
}
