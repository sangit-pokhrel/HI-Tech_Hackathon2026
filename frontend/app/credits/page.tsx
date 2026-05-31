"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCw,
  ShieldCheck,
  TrendingUp,
  Coins,
  Clock,
  Network,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Zap,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

// ==========================================
// HARDCODED FALLBACK PSYCHOMETRIC QUESTIONS
// Used when DB returns no questions
// ==========================================
const FALLBACK_QUESTIONS = [
  {
    _id: "fallback-1",
    question_text: "Your shop earns more than expected this month. What do you do first?",
    trait_measured: "PLANNING",
    options: {
      A: { text: "Save most of it for future business needs", score: 90 },
      B: { text: "Pay any outstanding supplier dues immediately", score: 80 },
      C: { text: "Invest part in new stock, save the rest", score: 85 },
      D: { text: "Spend it on personal needs first", score: 20 },
    },
  },
  {
    _id: "fallback-2",
    question_text: "If you borrowed NPR 50,000 for your business and sales drop the next month, how do you handle repayment?",
    trait_measured: "REPAYMENT_ATTITUDE",
    options: {
      A: { text: "Pay whatever I can and communicate the rest", score: 85 },
      B: { text: "Sell personal assets or savings to repay fully", score: 90 },
      C: { text: "Ask for a repayment extension", score: 65 },
      D: { text: "Wait until sales improve before paying", score: 20 },
    },
  },
  {
    _id: "fallback-3",
    question_text: "A supplier offers you goods worth NPR 30,000 on credit with no paperwork. How do you respond?",
    trait_measured: "HONESTY",
    options: {
      A: { text: "Accept, but insist on written documentation", score: 95 },
      B: { text: "Accept and maintain my own payment records", score: 85 },
      C: { text: "Negotiate a partial upfront payment instead", score: 70 },
      D: { text: "Accept without worrying about paperwork", score: 15 },
    },
  },
  {
    _id: "fallback-4",
    question_text: "How do you plan for seasonal slowdowns in your business (festivals, monsoon)?",
    trait_measured: "PLANNING",
    options: {
      A: { text: "Save during peak months to cover slow periods", score: 95 },
      B: { text: "Diversify products to offset seasonal dips", score: 85 },
      C: { text: "Reduce expenses drastically during slow periods", score: 65 },
      D: { text: "I don't plan specifically for it", score: 15 },
    },
  },
  {
    _id: "fallback-5",
    question_text: "A trusted friend asks you to guarantee their business loan. What do you do?",
    trait_measured: "RISK_CONTROL",
    options: {
      A: { text: "Agree only if I've seen their financials", score: 85 },
      B: { text: "Agree for a small guarantee, not full amount", score: 75 },
      C: { text: "Politely decline to protect my own credit", score: 80 },
      D: { text: "Agree immediately — they're trustworthy", score: 30 },
    },
  },
  {
    _id: "fallback-6",
    question_text: "You receive a big order but don't have enough stock. What do you do?",
    trait_measured: "CONSCIENTIOUSNESS",
    options: {
      A: { text: "Take the order, source stock urgently, fulfil on time", score: 90 },
      B: { text: "Take partial order to avoid risk", score: 80 },
      C: { text: "Decline and suggest another shop", score: 60 },
      D: { text: "Take the order even if I might not deliver on time", score: 20 },
    },
  },
  {
    _id: "fallback-7",
    question_text: "How consistently do you track your daily income and expenses?",
    trait_measured: "CONSISTENCY",
    options: {
      A: { text: "Daily — I have a notebook or app for it", score: 95 },
      B: { text: "Weekly — I tally at end of each week", score: 75 },
      C: { text: "Monthly — rough estimate at month end", score: 40 },
      D: { text: "I don't track it regularly", score: 10 },
    },
  },
  {
    _id: "fallback-8",
    question_text: "If digital payments show an error but you received the money, what do you do?",
    trait_measured: "HONESTY",
    options: {
      A: { text: "Report it to the payment provider immediately", score: 95 },
      B: { text: "Keep a note and inform customer + provider", score: 85 },
      C: { text: "Wait to see if they notice first", score: 30 },
      D: { text: "Keep it — it's their system's fault", score: 5 },
    },
  },
  {
    _id: "fallback-9",
    question_text: "An unexpected emergency (illness, flood) hits your household. How does it affect your business repayments?",
    trait_measured: "REPAYMENT_ATTITUDE",
    options: {
      A: { text: "I have emergency savings set aside separately", score: 95 },
      B: { text: "I'd contact the lender proactively to reschedule", score: 80 },
      C: { text: "I'd prioritize family first and repay late", score: 40 },
      D: { text: "I haven't thought about this scenario", score: 15 },
    },
  },
  {
    _id: "fallback-10",
    question_text: "How do you decide when to expand your business (new products, larger space)?",
    trait_measured: "RISK_CONTROL",
    options: {
      A: { text: "Only when I have consistent profits over several months", score: 90 },
      B: { text: "When a clear opportunity with manageable risk appears", score: 85 },
      C: { text: "When a loan becomes available", score: 45 },
      D: { text: "As soon as I feel confident about it", score: 30 },
    },
  },
];

// ==========================================
// DATA TIER DISPLAY CONFIG
// ==========================================
const TIER_CONFIG = {
  RICH: {
    label: "Established Profile",
    desc: "We have strong transaction history. Just 2 quick questions to refine your score.",
    color: "emerald",
    icon: TrendingUp,
  },
  THIN: {
    label: "Growing Profile",
    desc: "Your data is still building. Answer 4 questions to get a more accurate score.",
    color: "blue",
    icon: BarChart3,
  },
  ZERO: {
    label: "New Profile",
    desc: "No digital history yet. Answer 7 questions — your answers will anchor your first score.",
    color: "violet",
    icon: Brain,
  },
};

// Tier-based color helpers
const tierColor = (tier: string) => {
  if (tier === "RICH") return { border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (tier === "THIN") return { border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500/10" };
  return { border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/10" };
};

// Score band display
const getBandStyles = (band: string) => {
  switch (band?.toUpperCase()) {
    case "PLATINUM": return { bg: "bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold", label: "Platinum Rating" };
    case "GOLD": return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold", label: "Gold Rating" };
    case "SILVER": return { bg: "bg-slate-300/10 border-slate-300/30 text-slate-300 font-bold", label: "Silver Rating" };
    case "BRONZE": return { bg: "bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold", label: "Bronze Rating" };
    case "WATCH": return { bg: "bg-red-500/10 border-red-500/30 text-red-400 font-bold", label: "Watch Rating" };
    default: return { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400 font-bold", label: "Thin File" };
  }
};

// ==========================================
// MAIN PAGE
// ==========================================
export default function CreditsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  // ---- Score state ----
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- Profile assessment state ----
  const [dataProfile, setDataProfile] = useState<any>(null); // tier, questions_needed, etc.

  // ---- Questionnaire flow state ----
  // stage: "idle" | "intro" | "questions" | "computing" | "result"
  const [stage, setStage] = useState<"idle" | "intro" | "questions" | "computing" | "result">("idle");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string; score: number }>>({});
  const [computedScore, setComputedScore] = useState<any>(null);
  const [computeError, setComputeError] = useState("");
  const [computeStep, setComputeStep] = useState(0);

  // Redirect warning
  const [showNoScoreWarning, setShowNoScoreWarning] = useState(false);

  const answerStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("redirectReason") === "no-score") setShowNoScoreWarning(true);
    }
  }, []);

  // ---- Fetch existing score ----
  const fetchScoreData = useCallback(async (options?: { refresh?: boolean }) => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");
    setDataProfile(null);
    setStage("idle");
    setComputedScore(null);

    try {
      const query = options?.refresh ? "?refresh=true" : "";
      const res = await fetch(`/api/users/${currentUser.id}/score${query}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error_code === "NO_SCORE_RECORD") {
          setDataProfile(data.data_profile);
          // Load questions: prefer DB questions, fall back to hardcoded
          const needed = data.data_profile?.questions_needed ?? 7;
          const dbQs: any[] = data.psychometric_questions ?? [];
          const pool = dbQs.length >= needed ? dbQs : FALLBACK_QUESTIONS;
          setQuestions(pool.slice(0, needed));
          setStage("intro");
        } else {
          setError(data.message || "Failed to fetch credit score");
        }
      } else {
        setScoreData(data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching score.");
    } finally {
      setLoading(false);
    }
  }, [session, currentUser]);

  useEffect(() => {
    fetchScoreData();
  }, [fetchScoreData]);

  // ---- Force recalculation of assessment ----
  const handleRecalculateAssessment = async () => {
    if (!session || !currentUser?.id) return;
    setLoading(true);
    setError("");
    setDataProfile(null);
    setScoreData(null);
    setStage("idle");
    setComputedScore(null);

    try {
      const res = await fetch(`/api/users/${currentUser.id}/score?force_assessment=true`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error_code === "NO_SCORE_RECORD") {
          setDataProfile(data.data_profile);
          const needed = data.data_profile?.questions_needed ?? 7;
          const dbQs: any[] = data.psychometric_questions ?? [];
          const pool = dbQs.length >= needed ? dbQs : FALLBACK_QUESTIONS;
          setQuestions(pool.slice(0, needed));
          setStage("intro");
        } else {
          setError(data.message || "Failed to fetch questions");
        }
      } else {
        setScoreData(data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while starting recalculation.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Answer a question ----
  const handleSelectOption = (questionId: string, option: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected: option, score } }));
  };

  // ---- Navigate questions ----
  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      answerStartRef.current = Date.now();
    } else {
      handleSubmitAnswers();
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
    else setStage("intro");
  };

  // ---- Submit answers to backend → ML ----
  const handleSubmitAnswers = async () => {
    setStage("computing");
    setComputeError("");

    const answersPayload = questions.map((q) => ({
      question_id: q._id,
      selected_option: answers[q._id]?.selected ?? "A",
      option_score: answers[q._id]?.score ?? 50,
    }));

    try {
      setComputeStep(1); // Analysing
      await new Promise((r) => setTimeout(r, 900));
      setComputeStep(2); // Running ML
      await new Promise((r) => setTimeout(r, 800));

      const res = await fetch(`/api/users/${currentUser.id}/score/compute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({ answers: answersPayload }),
      });

      setComputeStep(3); // Finalizing

      const data = await res.json();

      if (!res.ok) {
        setComputeError(data.message || "ML computation failed");
        setStage("questions");
        return;
      }

      await new Promise((r) => setTimeout(r, 600));
      setComputedScore(data);
      setStage("result");
    } catch (err: any) {
      setComputeError(err.message || "Failed to compute score");
      setStage("questions");
    }
  };

  // ---- Progress helpers ----
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] : undefined;
  const canProceed = !!currentAnswer;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <DashboardLayout
      scoreLoading={loading}
      onRecalculate={handleRecalculateAssessment}
      showRecalculate={!!scoreData && !computedScore}
    >
      {/* Redirect warning banner */}
      {showNoScoreWarning && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold mb-6 flex items-start gap-2.5 leading-relaxed animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            You must activate your Nagarik Credit Score rating before submitting micro-credit loan
            applications. Run alternative behavioral score audits below first.
          </span>
        </div>
      )}

      {/* Generic error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium mb-8">
          {error}
        </div>
      )}

      {/* ─── LOADING ─── */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-5 bg-slate-900 rounded w-1/3 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-900 rounded w-1/2" />
                <div className="h-4 bg-slate-900 rounded w-10" />
              </div>
              <div className="h-2 bg-slate-900 rounded" />
            </div>
          ))}
        </div>

      ) : scoreData ? (
        /* ─── EXISTING SCORE VIEW ─── */
        <div className="space-y-8">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-600/5 blur-xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <span
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-lg text-slate-200 border bg-slate-900 ${
                  scoreData.score >= 700 ? "border-emerald-500/30" : "border-slate-800"
                }`}
              >
                {scoreData.score}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-200">Active Alternative Rating</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on 5 non-traditional indicators</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl border text-xs ${getBandStyles(scoreData.score_band).bg}`}>
                {getBandStyles(scoreData.score_band).label}
              </span>
              <span className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                Confidence ±{scoreData.confidence_interval} Points
              </span>
            </div>
          </div>
          <ScoreInsightsPanel result={scoreData} onRefresh={() => fetchScoreData({ refresh: true })} />
        </div>

      ) : stage === "intro" && dataProfile ? (
        /* ─── INTRO: Data Profile Card + Start CTA ─── */
        <IntroCard
          dataProfile={dataProfile}
          questionsCount={questions.length}
          onStart={() => { setCurrentQ(0); setAnswers({}); setStage("questions"); }}
        />

      ) : stage === "questions" && currentQuestion ? (
        /* ─── QUESTION STEPPER ─── */
        <QuestionStepper
          question={currentQuestion}
          questionIndex={currentQ}
          totalQuestions={questions.length}
          currentAnswer={currentAnswer}
          progressPct={progressPct}
          canProceed={canProceed}
          computeError={computeError}
          onSelect={handleSelectOption}
          onNext={handleNext}
          onBack={handleBack}
          dataProfile={dataProfile}
        />

      ) : stage === "computing" ? (
        /* ─── COMPUTING ANIMATION ─── */
        <ComputingView step={computeStep} />

      ) : stage === "result" && computedScore ? (
        /* ─── COMPUTED SCORE RESULT ─── */
        <ComputedScoreView
          result={computedScore}
          onRefresh={fetchScoreData}
        />

      ) : null}
    </DashboardLayout>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function IntroCard({
  dataProfile,
  questionsCount,
  onStart,
}: {
  dataProfile: any;
  questionsCount: number;
  onStart: () => void;
}) {
  const tier = (dataProfile?.tier ?? "ZERO") as "RICH" | "THIN" | "ZERO";
  const cfg = TIER_CONFIG[tier];
  const colors = tierColor(tier);
  const TierIcon = cfg.icon;

  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl max-w-2xl mx-auto my-4">
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${tier === "RICH" ? "from-emerald-500/20 to-teal-500/10" : tier === "THIN" ? "from-blue-500/20 to-cyan-500/10" : "from-violet-500/20 to-purple-500/10"} opacity-50 group-hover:opacity-100 blur transition duration-700`} />

      <div className="relative p-8 rounded-2xl bg-slate-950/90 text-center space-y-6">
        {/* Tier badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.border} ${colors.bg} ${colors.text} text-xs font-bold tracking-wider`}>
          <TierIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} mx-auto`}>
          <Brain className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Activate Your Credit Score
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
            {cfg.desc}
          </p>
        </div>

        {/* Data stats */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-lg font-extrabold text-slate-200">{dataProfile.wallet_age_months}</p>
            <p className="text-xs text-slate-500 mt-0.5">Wallet Age (months)</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-lg font-extrabold text-slate-200">{dataProfile.transaction_count}</p>
            <p className="text-xs text-slate-500 mt-0.5">Transactions</p>
          </div>
        </div>

        {/* Questions count */}
        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg} text-center max-w-xs mx-auto`}>
          <p className={`text-sm font-semibold ${colors.text}`}>
            <span className="text-xl font-extrabold">{questionsCount}</span> quick questions
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Takes less than 2 minutes</p>
        </div>

        {/* Start CTA */}
        <button
          onClick={onStart}
          className={`inline-flex items-center gap-2 font-bold py-3 px-8 rounded-xl transition-all shadow-lg cursor-pointer active:scale-[0.98] ${
            tier === "RICH"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/15"
              : tier === "THIN"
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/15"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/15"
          }`}
        >
          Start Assessment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function QuestionStepper({
  question,
  questionIndex,
  totalQuestions,
  currentAnswer,
  progressPct,
  canProceed,
  computeError,
  onSelect,
  onNext,
  onBack,
  dataProfile,
}: {
  question: any;
  questionIndex: number;
  totalQuestions: number;
  currentAnswer: { selected: string; score: number } | undefined;
  progressPct: number;
  canProceed: boolean;
  computeError: string;
  onSelect: (id: string, opt: string, score: number) => void;
  onNext: () => void;
  onBack: () => void;
  dataProfile: any;
}) {
  const tier = (dataProfile?.tier ?? "ZERO") as "RICH" | "THIN" | "ZERO";
  const colors = tierColor(tier);
  const isLast = questionIndex === totalQuestions - 1;

  const optionKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className={`font-bold ${colors.text}`}>{progressPct}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tier === "RICH" ? "bg-emerald-500" : tier === "THIN" ? "bg-blue-500" : "bg-violet-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Trait badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${colors.border} ${colors.bg} ${colors.text} tracking-widest uppercase`}>
        <Zap className="w-3 h-3" />
        {question.trait_measured?.replace("_", " ") ?? "Behavioral"}
      </div>

      {/* Question card */}
      <div
        key={question._id}
        className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-sm"
        style={{ animation: "fadeSlideIn 0.25s ease" }}
      >
        <h3 className="text-base font-bold text-slate-100 leading-snug mb-5">
          {question.question_text}
        </h3>

        <div className="space-y-3">
          {optionKeys.map((key) => {
            const opt = question.options?.[key];
            if (!opt) return null;
            const isSelected = currentAnswer?.selected === key;

            return (
              <button
                key={key}
                onClick={() => onSelect(question._id, key, opt.score)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? tier === "RICH"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-slate-100"
                      : tier === "THIN"
                      ? "border-blue-500/60 bg-blue-500/10 text-slate-100"
                      : "border-violet-500/60 bg-violet-500/10 text-slate-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5 transition-colors ${
                      isSelected
                        ? tier === "RICH"
                          ? "bg-emerald-500 text-white"
                          : tier === "THIN"
                          ? "bg-blue-500 text-white"
                          : "bg-violet-500 text-white"
                        : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm leading-snug">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {computeError && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium">
          {computeError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors cursor-pointer py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {questionIndex === 0 ? "Back to Overview" : "Previous"}
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
            canProceed
              ? tier === "RICH"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : tier === "THIN"
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          }`}
        >
          {isLast ? "Calculate My Score" : "Next Question"}
          {isLast ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ComputingView({ step }: { step: number }) {
  const steps = [
    { label: "Analysing your psychometric responses...", icon: Brain },
    { label: "Running ML credit risk model...", icon: BarChart3 },
    { label: "Generating your Nagarik Credits score...", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 max-w-md mx-auto text-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
        <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
          <RotateCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-100">Computing Your Score</h2>
        <p className="text-sm text-slate-500">Nagarik Credits AI is evaluating your profile...</p>
      </div>

      <div className="w-full space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isDone = step > i + 1;
          const isActive = step === i + 1;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  : isActive
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400 animate-pulse"
                  : "border-slate-800 bg-slate-900/20 text-slate-600"
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "animate-spin" : ""}`} />
              )}
              <span className="text-xs font-semibold">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreInsightsPanel({ result, onRefresh }: { result: any; onRefresh: () => void }) {
  const explanationSummary: string = result.explanation_summary ?? "";
  const topImprovementAction: string = result.top_improvement_action ?? explanationSummary;
  const positiveFactors: string[] = result.positive_factors ?? [];
  const riskFactors: string[] = result.risk_factors ?? [];
  const scoreSource = result.score_source ?? "stored";
  const calculatedAtLabel = result.calculated_at
    ? new Date(result.calculated_at).toLocaleString()
    : null;

  const factorHighlights = [
    {
      label: "Transaction consistency",
      value: result.factor_breakdown?.F1_transaction_consistency?.score,
      max: result.factor_breakdown?.F1_transaction_consistency?.max,
    },
    {
      label: "Cashflow health",
      value: result.factor_breakdown?.F2_cashflow_health?.score,
      max: result.factor_breakdown?.F2_cashflow_health?.max,
    },
    {
      label: "Payment reliability",
      value: result.factor_breakdown?.F3_payment_reliability?.score,
      max: result.factor_breakdown?.F3_payment_reliability?.max,
    },
    {
      label: "Integrity",
      value: result.factor_breakdown?.F4_integrity?.score,
      max: result.factor_breakdown?.F4_integrity?.max,
    },
  ].filter((item) => typeof item.value === "number");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 font-semibold uppercase tracking-wider text-slate-300">
          {scoreSource === "stored" ? "Saved score" : scoreSource === "stored_fallback" ? "Saved fallback" : "Live score"}
        </span>
        {calculatedAtLabel && (
          <span className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 font-semibold">
            Last calculated {calculatedAtLabel}
          </span>
        )}
      </div>

      {result.warning && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs font-medium text-amber-400">
          {result.warning}
        </div>
      )}

      {(explanationSummary || topImprovementAction) && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Why this score</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {topImprovementAction || explanationSummary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Stored score factors</span>
          </div>
          {positiveFactors.length > 0 || riskFactors.length > 0 ? (
            <div className="space-y-3 text-sm text-slate-300">
              {positiveFactors.slice(0, 3).map((factor: string, index: number) => (
                <div key={`positive-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {factor}
                </div>
              ))}
              {riskFactors.slice(0, 3).map((factor: string, index: number) => (
                <div key={`risk-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0" />
                  {factor}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-slate-300">
              {factorHighlights.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-bold text-slate-100">
                    {item.value}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Snapshot</span>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Repayment confidence</p>
              <p className="text-xl font-bold text-slate-100 mt-2">
                {result.ml_prediction?.repayment_probability
                  ? `${(result.ml_prediction.repayment_probability * 100).toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Integrity flags</p>
              <p className="text-xl font-bold text-slate-100 mt-2">{result.flags?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all cursor-pointer"
      >
        <RotateCw className="w-4 h-4" />
        Refresh With Latest Activity
      </button>
    </div>
  );
}

function ComputedScoreView({ result, onRefresh }: { result: any; onRefresh: () => void }) {
  const score = result.score ?? 0;
  const band = result.score_band ?? "THIN_FILE";
  const bandStyles = getBandStyles(band);
  const tier = result.data_profile?.tier ?? "ZERO";
  const colors = tierColor(tier);

  const scoreColor =
    score >= 700 ? "text-emerald-400" : score >= 500 ? "text-amber-400" : "text-red-400";

  const positiveFactors: string[] = result.positive_factors ?? [];
  const riskFactors: string[] = result.risk_factors ?? [];
  const explanationSummary: string = result.explanation_summary ?? "";
  const topImprovementAction: string =
    result.top_improvement_action ??
    explanationSummary ??
    "The alternative credit score blends your psychometric answers with transaction behavior and community integrity signals.";

  return (
    <div className="space-y-6 max-w-2xl mx-auto" style={{ animation: "fadeSlideIn 0.4s ease" }}>
      {/* Computed badge */}
      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit">
        <Zap className="w-3.5 h-3.5" />
        ML-Computed Score · Psychometric Assessment
      </div>

      {/* Main score card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-600/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl border bg-slate-900 flex items-center justify-center font-extrabold text-xl ${
                score >= 700 ? "border-emerald-500/40" : score >= 500 ? "border-amber-500/40" : "border-red-500/40"
              } ${scoreColor}`}
            >
              {score}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">Nagarik Credits Score</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed via AI · {result.data_profile?.psychometric_questions_answered ?? 0} psychometric signals
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-4 py-2 rounded-xl border text-xs ${bandStyles.bg}`}>
              {bandStyles.label}
            </span>
            <span className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
              ±{result.confidence_interval ?? 40} pts
            </span>
          </div>
        </div>
      </div>

      {/* ML Prediction probabilities */}
      {result.ml_prediction && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <p className="text-xs text-slate-500 mb-1">Default Risk</p>
            <p className={`text-lg font-extrabold ${
              result.ml_prediction.default_probability < 0.3
                ? "text-emerald-400"
                : result.ml_prediction.default_probability < 0.6
                ? "text-amber-400"
                : "text-red-400"
            }`}>
              {(result.ml_prediction.default_probability * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Probability of default</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <p className="text-xs text-slate-500 mb-1">Repayment Confidence</p>
            <p className="text-lg font-extrabold text-emerald-400">
              {(result.ml_prediction.repayment_probability * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Probability of repayment</p>
          </div>
        </div>
      )}

      {/* Psychometric summary */}
      {result.data_profile && (
        <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`w-4 h-4 ${colors.text}`} />
            <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>
              Psychometric Input
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Behavioral Score Average</span>
            <span className="font-bold text-slate-200">{result.data_profile.psychometric_avg} / 1000</span>
          </div>
        </div>
      )}

      {/* Explanation summary */}
      {explanationSummary && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Assessment Summary</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{explanationSummary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Why this score?</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            {topImprovementAction}
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            {positiveFactors.length > 0 ? (
              positiveFactors.slice(0, 3).map((factor: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {factor}
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  Strong repayment discipline and transaction consistency.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  High psychometric reliability and planning attitude.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  Healthy community trust and social reputation signals.
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Social Trust Snapshot</span>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Community Integrity</p>
              <p className="text-xl font-bold text-slate-100 mt-2">
                {result.factor_breakdown?.F4_integrity?.score ?? "--"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Higher values indicate stronger social trust and collusion immunity.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Flag Count</p>
              <p className="text-xl font-bold text-slate-100 mt-2">{result.flags?.length ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Detected integrity or behavior alerts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Positive factors */}
      {positiveFactors.length > 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Positive Signals</span>
          </div>
          {positiveFactors.map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Risk Signals</span>
          </div>
          {riskFactors.map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm text-red-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Loan suggestion */}
      {(result.suggested_loan_amount > 0 || !result.suggested_loan_amount) && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loan Recommendation</p>
              {result.suggested_loan_amount > 0 ? (
                <p className="text-lg font-extrabold text-slate-100 mt-2">NPR {result.suggested_loan_amount.toLocaleString()}</p>
              ) : (
                <p className="text-sm text-slate-400 mt-2">Your score qualifies you to request a micro-credit product. Proceed to loan request for exact matching.</p>
              )}
            </div>
            <Link href="/loans" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all">
              Request Loan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all cursor-pointer"
      >
        <RotateCw className="w-4 h-4" />
        Refresh Score Data
      </button>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
