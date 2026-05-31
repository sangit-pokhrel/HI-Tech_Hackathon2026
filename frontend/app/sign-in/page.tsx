"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#03060f]">
      {/* Radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none animate-pulse duration-[15000ms]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-md mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Secure Auth</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Nagarik Credits
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to check alternative financial trust index.
          </p>
        </div>

        {/* Auth Card */}
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/40">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-emerald-500/10 opacity-30 group-hover:opacity-100 blur transition duration-700" />
          
          <div className="relative p-8 rounded-2xl bg-slate-950/80">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium animate-fade-in">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
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

              {/* Password */}
              <div className="space-y-2">
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-semibold transition-all">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Seeder Credentials Helper box */}
        <div className="mt-6 p-4 rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md text-center">
          <p className="text-xs text-slate-500">
            Hackathon Demo User: <code className="text-blue-400 font-mono">user1@nagarikcredits.com</code> · <code className="text-blue-400 font-mono">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
