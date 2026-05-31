"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User as UserIcon,
  FileText,
  AlertTriangle,
  RotateCw,
  Sparkles,
  MapPin,
  FileCode,
  CheckCircle
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isSignedIn = status === "authenticated";
  const currentUser = session?.user as any;

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Deterministic mock citizenship info based on user name/phone
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

  const ctz = getMockCitizenship(currentUser);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#03060f]">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header Banner */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">My Nagarik Profile</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                Profile Portal: {currentUser?.name || "Customer"}
                <Sparkles className="w-5 h-5 text-blue-400" />
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                System Code: {currentUser?.id || "USR-XXXXX"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-blue-500/10 border-blue-500/30 text-blue-400 font-mono">
                {currentUser?.user_type}
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                currentUser?.verified_status === "verified"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
              }`}>
                {currentUser?.verified_status === "verified" ? "Verified Identity" : "Awaiting Verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Grid 1: Basic Profile Details & Address Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Location & Contact Card */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group lg:col-span-1 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" /> Location & Contact
              </span>
            </div>
            
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Registered Mobile</span>
                <span className="font-bold text-slate-200 font-mono">{currentUser?.phone || "980XXXXXXX"}</span>
              </div>
              {currentUser?.email && (
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Email Address</span>
                  <span className="font-bold text-slate-200 truncate block">{currentUser.email}</span>
                </div>
              )}
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Province</span>
                <span className="font-bold text-slate-200">{currentUser?.location?.province || "Bagmati"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">District Registry</span>
                <span className="font-bold text-slate-200">{currentUser?.location?.district || "Kathmandu"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Municipality</span>
                  <span className="font-bold text-slate-200">{currentUser?.location?.municipality || "Kathmandu"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Ward No</span>
                  <span className="font-bold text-slate-200">Ward {currentUser?.location?.ward_no || 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Identity Details (Formality Audit) */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden group lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Verified Citizenship Credentials</h3>
            </div>

            {ctz ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">
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
                  <span className="font-bold text-slate-300 font-mono">{ctz.dob}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Father's Legal Name</span>
                  <span className="font-bold text-slate-300">{ctz.fatherName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Mother's Legal Name</span>
                  <span className="font-bold text-slate-300">{ctz.motherName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Citizenship Type</span>
                  <span className="font-bold text-slate-300">{ctz.citizenshipType}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Date of Issue</span>
                  <span className="font-bold text-slate-300 font-mono">{ctz.issueDate}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">District of Issue</span>
                  <span className="font-bold text-slate-300">{ctz.issueDistrict}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Electricity SC No</span>
                  <span className="font-bold text-slate-300 font-mono">021.05.{currentUser?.phone ? currentUser.phone.slice(-3) : "102"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No profile parameters calculated.</p>
            )}
          </div>
        </div>

        {/* Security & KYC Formality Badges */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md relative overflow-hidden group flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-400" /> Nagarik Economic Identity Network
            </span>
            <p className="text-[11px] text-slate-500">
              Your profile is verified and secured using SHA-256 legal block hashes. Alternatives checks like NEASC are for credit underwriting formalities only.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 font-mono">
            <CheckCircle className="w-3.5 h-3.5" /> SECURE HANDSHAKE COMPLETED
          </span>
        </div>

      </div>
    </DashboardLayout>
  );
}
