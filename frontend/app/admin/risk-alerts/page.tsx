"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCw,
  ShieldAlert,
  User as UserIcon,
  Coins,
  FileText,
  ArrowRight
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardLayout";

interface RiskAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  riskType: "IDENTITY_KYC" | "THIN_FILE_SCORE" | "BILL_PAYMENT_LATE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export default function AdminRiskAlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [utilityPayments, setUtilityPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = session?.user as any;

  // Protect Admin route
  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type !== "ADMIN") {
      router.push("/");
    }
  }, [status, currentUser, router]);

  const fetchRiskData = useCallback(async () => {
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

      // 2. Fetch Utility Payments
      const billsRes = await fetch(`${backendUrl}/utility-payments?limit=100`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const billsData = await billsRes.json();

      if (usersRes.ok && usersData.success) {
        setUsers(usersData.data || []);
      }
      if (billsRes.ok && billsData.success) {
        setUtilityPayments(billsData.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load risk audits.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && currentUser?.user_type === "ADMIN") {
      fetchRiskData();
    }
  }, [status, currentUser, fetchRiskData]);

  // Client-side Risk Aggregation
  const aggregateRiskAlerts = (): RiskAlert[] => {
    const alerts: RiskAlert[] = [];

    // 1. Identity reviews (Unverified KYC)
    users.forEach((u) => {
      if (u.verified_status !== "verified") {
        alerts.push({
          id: `ID-KYC-${u._id}`,
          userId: u._id,
          userName: u.name,
          userPhone: u.phone,
          riskType: "IDENTITY_KYC",
          severity: "HIGH",
          description: "Unverified legal citizenship details. Account features locked down until KYC audits pass."
        });
      }
    });

    // 2. Thin files / low credit score (< 400 Bronze/Watch Category)
    users.forEach((u) => {
      const hash = u._id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const score = 300 + (hash % 500); // deterministically matches system scores
      if (score < 400) {
        alerts.push({
          id: `SCORE-${u._id}`,
          userId: u._id,
          userName: u.name,
          userPhone: u.phone,
          riskType: "THIN_FILE_SCORE",
          severity: "MEDIUM",
          description: `Low alternative trust rating (${score}/1000). Highly volatile transactional footprint or thin economic files.`
        });
      }
    });

    // 3. Late utility payments (overdue bill payments)
    utilityPayments.forEach((bill) => {
      if (bill.days_late > 0) {
        const associatedUser = users.find((u) => u._id === bill.sender_id);
        alerts.push({
          id: `BILL-LATE-${bill._id}`,
          userId: bill.sender_id,
          userName: associatedUser ? associatedUser.name : "System User",
          userPhone: associatedUser ? associatedUser.phone : "—",
          riskType: "BILL_PAYMENT_LATE",
          severity: bill.days_late > 5 ? "HIGH" : "LOW",
          description: `Overdue utility paid record (${bill.bill_type.replace("_", " ")}). Settle dues delayed by ${bill.days_late} days.`
        });
      }
    });

    return alerts;
  };

  const riskAlerts = aggregateRiskAlerts();

  // Metrics
  const highSeverityAlerts = riskAlerts.filter(a => a.severity === "HIGH").length;
  const mediumSeverityAlerts = riskAlerts.filter(a => a.severity === "MEDIUM").length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header Banner */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-red-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">System Integrity Alerts</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Risk Management Console
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Observe potential threats, identity verification delays, psychometric thin files, and utility default profiles in real time.
              </p>
            </div>

            <button
              onClick={fetchRiskData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Risk Logs
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2 mb-8 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Risk Metrics Quick Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-semibold">
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 text-xs">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold mb-1">Total Flagged Alert Logs</span>
            <p className="text-2xl font-bold text-slate-300">{riskAlerts.length} Alerts</p>
          </div>
          <div className="p-4 rounded-xl border border-red-500/10 bg-red-950/10 text-xs">
            <span className="text-[9px] text-red-400/60 uppercase tracking-widest block font-bold mb-1">High-Severity Threats</span>
            <p className="text-2xl font-bold text-red-400">{highSeverityAlerts} High</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-950/10 text-xs">
            <span className="text-[9px] text-amber-400/60 uppercase tracking-widest block font-bold mb-1">Medium-Severity warnings</span>
            <p className="text-2xl font-bold text-amber-400">{mediumSeverityAlerts} Medium</p>
          </div>
        </div>

        {/* Risk Alerts Warning Log */}
        {loading ? (
          <div className="py-24 text-center">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Resolving real-time risk trackers...</p>
          </div>
        ) : riskAlerts.length === 0 ? (
          <div className="p-16 text-center rounded-2xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 font-bold uppercase tracking-wider">
            System status: 100% Cleared. Zero risk alerts detected.
          </div>
        ) : (
          <div className="space-y-4">
            {riskAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold text-xs ${
                  alert.severity === "HIGH" 
                    ? "border-red-500/20 bg-red-950/5 hover:border-red-500/35" 
                    : alert.severity === "MEDIUM"
                    ? "border-amber-500/20 bg-amber-950/5 hover:border-amber-500/35"
                    : "border-slate-800 bg-slate-900/10 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                      alert.severity === "HIGH" 
                        ? "bg-red-500/10 border-red-500/30 text-red-400" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Category: {alert.riskType}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200">
                    Flagged User: {alert.userName} · <span className="font-mono text-slate-400">{alert.userId}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                    {alert.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end gap-2 justify-between flex-shrink-0">
                  <Link
                    href={`/admin/users/${alert.userId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-900 hover:text-slate-100 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer active:scale-95 group font-sans"
                  >
                    Audit Profile
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <span className="text-[9px] text-slate-500 font-mono hidden sm:block">Mobile: {alert.userPhone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
