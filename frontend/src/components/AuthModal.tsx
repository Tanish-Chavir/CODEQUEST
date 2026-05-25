"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mail, ChevronLeft, RefreshCw, KeyRound, CheckCircle2, 
  Lock, User, UserPlus, LogIn, Eye, EyeOff 
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

type AuthStep = 
  | "login"
  | "signup-email"
  | "signup-otp"
  | "signup-credentials"
  | "forgot-email"
  | "forgot-otp"
  | "forgot-reset";

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus helper on OTP step change
  useEffect(() => {
    if ((step === "signup-otp" || step === "forgot-otp") && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Helper to reset modal fields
  const resetFormState = () => {
    setStep("login");
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
    setOtp(Array(6).fill(""));
    setError("");
    setDevOtp("");
    setIsSuccess(false);
    setSuccessMessage("");
  };

  // ─── LOGIN FLOW ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError("");
    setLoading(true);

    try {
      const data = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user);
      setSuccessMessage("Sign in successful!");
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        resetFormState();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── SIGN UP FLOW: STEP 1 (Send Signup OTP) ───
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      const data = await fetchWithAuth("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (data && data.devOtp) {
        setDevOtp(data.devOtp);
      } else {
        setDevOtp("");
      }

      setStep("signup-otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── SIGN UP FLOW: STEP 2 (Verify OTP) ───
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Call backend OTP verification (verifies only, doesn't register yet)
      await fetchWithAuth("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: otpValue }),
      });

      // Clear dev OTP and proceed to credential inputs
      setDevOtp("");
      setStep("signup-credentials");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── SIGN UP FLOW: STEP 3 (Final Registration) ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError("");
    setLoading(true);

    try {
      const data = await fetchWithAuth("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      login(data.token, data.user);
      setSuccessMessage("Account created successfully!");
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        resetFormState();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Username might be taken.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD FLOW: STEP 1 (Send Reset OTP) ───
  const handleSendForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      const data = await fetchWithAuth("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (data && data.devOtp) {
        setDevOtp(data.devOtp);
      } else {
        setDevOtp("");
      }

      setStep("forgot-otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD FLOW: STEP 2 (Verify Reset OTP) ───
  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    // Proceed to reset credentials input screen
    setError("");
    setStep("forgot-reset");
  };

  // ─── FORGOT PASSWORD FLOW: STEP 3 (Reset Password) ───
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    const otpValue = otp.join("");

    try {
      await fetchWithAuth("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp: otpValue, newPassword: password }),
      });

      setSuccessMessage("Password reset successful!");
      setIsSuccess(true);

      setTimeout(() => {
        resetFormState();
        setStep("login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RESEND OTP HANDLER ───
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const isResetFlow = step === "forgot-otp";
      const endpoint = isResetFlow ? "/auth/forgot-password" : "/auth/send-otp";

      const data = await fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (data && data.devOtp) {
        setDevOtp(data.devOtp);
      } else {
        setDevOtp("");
      }

      setResendCooldown(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP INPUT HELPER METHODS ───
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value[value.length - 1];
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl p-8 text-white">
              
              {/* Decorative Background Glows */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-5 top-5 rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {isSuccess ? (
                  /* ─── SUCCESS STATE ─── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="rounded-full bg-emerald-500/10 p-4 text-emerald-400 border border-emerald-500/20 mb-6"
                    >
                      <CheckCircle2 className="w-16 h-16" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-white mb-2">{successMessage}</h3>
                    <p className="text-neutral-400 text-sm">Transferring to your developer base...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    
                    {/* Header Details */}
                    <div className="mb-6 text-center">
                      <div className="inline-flex rounded-2xl bg-indigo-500/10 p-3 text-indigo-400 border border-indigo-500/20 mb-3 select-none">
                        {step === "login" ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">
                        {step === "login" && "CodeQuest Login"}
                        {step.startsWith("signup") && "Create Account"}
                        {step.startsWith("forgot") && "Password Recovery"}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">
                        {step === "login" && "Sign in to continue your gamified learning quest."}
                        {step === "signup-email" && "Enter your email to verify your address first."}
                        {step === "signup-otp" && "Verify the 6-digit registration code sent to your mail."}
                        {step === "signup-credentials" && "Setup your secure username and password."}
                        {step === "forgot-email" && "Request an OTP code to verify account ownership."}
                        {step === "forgot-otp" && "Verify the 6-digit recovery code sent to your mail."}
                        {step === "forgot-reset" && "Set a new secure access password."}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold">
                        {error}
                      </div>
                    )}

                    {/* Developer Sandbox OTP Assistant */}
                    {devOtp && (
                      <div className="mb-5 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold space-y-1 text-center animate-pulse">
                        <p className="text-white text-xs font-black">🔧 CodeQuest Sandbox Assistant</p>
                        <p>Real SMTP is offline. We've auto-routed your OTP here:</p>
                        <p className="text-sm tracking-widest text-indigo-300 font-black mt-1">
                          OTP Code: <span className="bg-indigo-950 text-white border border-indigo-500/30 px-2 py-0.5 rounded ml-1 font-mono text-xs">{devOtp}</span>
                        </p>
                      </div>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 1️⃣ STANDARD EMAIL & PASSWORD LOGIN SCREEN */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "login" && (
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type="email"
                            placeholder="Email address"
                            required
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="text-right select-none">
                          <button
                            type="button"
                            onClick={() => { setStep("forgot-email"); setError(""); }}
                            className="text-[10px] font-bold text-neutral-400 hover:text-indigo-400 hover:underline transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !email || !password}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                          Confirm & Access Dashboard
                        </button>

                        <div className="text-center text-[11px] text-neutral-400 mt-4 select-none">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            onClick={() => { setStep("signup-email"); setError(""); }}
                            className="text-indigo-400 font-bold hover:underline"
                          >
                            Create an Account
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 2️⃣ SIGN UP FLOW: STEP 1 (Email Request) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "signup-email" && (
                      <form onSubmit={handleSendSignupOtp} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type="email"
                            placeholder="your.email@domain.com"
                            required
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !email}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Send Verification Code
                        </button>

                        <button
                          type="button"
                          onClick={() => { setStep("login"); setError(""); }}
                          className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Back to Login
                        </button>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 2️⃣ SIGN UP FLOW: STEP 2 (OTP Input) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "signup-otp" && (
                      <form onSubmit={handleVerifySignupOtp} className="space-y-5">
                        <div className="flex justify-between gap-2.5 select-none">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              disabled={loading}
                              value={digit}
                              ref={(el) => { inputRefs.current[idx] = el; }}
                              onChange={(e) => handleOtpChange(e.target, idx)}
                              onKeyDown={(e) => handleKeyDown(e, idx)}
                              onPaste={handlePaste}
                              className="w-12 h-14 bg-neutral-950 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                            />
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={loading || otp.join("").length !== 6}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Confirm Code
                        </button>

                        <div className="text-center text-[10px] select-none">
                          <span className="text-neutral-500">Didn't receive the email? </span>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || loading}
                            className="text-indigo-400 font-bold hover:underline disabled:text-neutral-600 disabled:no-underline transition-all"
                          >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setStep("signup-email"); setError(""); }}
                          className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Change Email
                        </button>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 2️⃣ SIGN UP FLOW: STEP 3 (Username & Password) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "signup-credentials" && (
                      <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-600" />
                          <input
                            type="email"
                            readOnly
                            disabled
                            value={email}
                            className="w-full bg-neutral-950/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-neutral-500 cursor-not-allowed select-none"
                          />
                        </div>

                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type="text"
                            placeholder="Pick a username"
                            required
                            disabled={loading}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Set a password"
                            required
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !username || !password}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Complete Registration
                        </button>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 3️⃣ FORGOT PASSWORD FLOW: STEP 1 (Email Request) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "forgot-email" && (
                      <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type="email"
                            placeholder="your.registered.email@domain.com"
                            required
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !email}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Send Recovery Code
                        </button>

                        <button
                          type="button"
                          onClick={() => { setStep("login"); setError(""); }}
                          className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Cancel Recovery
                        </button>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 3️⃣ FORGOT PASSWORD FLOW: STEP 2 (OTP Input) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "forgot-otp" && (
                      <form onSubmit={handleVerifyForgotOtp} className="space-y-5">
                        <div className="flex justify-between gap-2.5 select-none">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              disabled={loading}
                              value={digit}
                              ref={(el) => { inputRefs.current[idx] = el; }}
                              onChange={(e) => handleOtpChange(e.target, idx)}
                              onKeyDown={(e) => handleKeyDown(e, idx)}
                              onPaste={handlePaste}
                              className="w-12 h-14 bg-neutral-950 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                            />
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={loading || otp.join("").length !== 6}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Confirm Verification Code
                        </button>

                        <div className="text-center text-[10px] select-none">
                          <span className="text-neutral-500">Didn't receive the email? </span>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || loading}
                            className="text-indigo-400 font-bold hover:underline disabled:text-neutral-600 disabled:no-underline transition-all"
                          >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setStep("forgot-email"); setError(""); }}
                          className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Change Email
                        </button>
                      </form>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* 3️⃣ FORGOT PASSWORD FLOW: STEP 3 (Password Reset) */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {step === "forgot-reset" && (
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            required
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            required
                            disabled={loading}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !password || !confirmPassword}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                          Set New Password
                        </button>
                      </form>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
