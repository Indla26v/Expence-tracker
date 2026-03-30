"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setError("Invalid email or password");
        return;
      }

      router.replace(res.url ?? callbackUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background text-foreground overflow-hidden relative">
      {/* Animated background shapes - no squares */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating and rotating circles only */}
        <div className="absolute top-20 left-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-20 w-60 h-60 bg-blue-700/15 rounded-full blur-3xl animate-[floatReverse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-blue-800/15 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />
        
        {/* Morphing blob shapes - no diamonds */}
        <div className="absolute top-1/4 right-1/3 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl animate-[morph_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl animate-[morph_9s_ease-in-out_infinite_2s]" />
        
        {/* Pulsing and scaling orbs */}
        <div className="absolute top-10 right-1/3 w-40 h-40 border border-blue-500/20 rounded-full blur-xl animate-[pulseAndScale_5s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 left-1/2 w-52 h-52 border-2 border-blue-400/15 rounded-full blur-lg animate-[rotate_20s_linear_infinite]" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-blue-600/40 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl shadow-blue-600/20 backdrop-blur-xl relative z-10 animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
            Expense Tracker
          </h1>
          <p className="mt-2 text-sm text-blue-400/70">Sign in to your account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-blue-300" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-blue-600/30 bg-gradient-to-r from-blue-600/10 to-blue-700/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-all duration-300 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-blue-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-lg border border-blue-600/30 bg-gradient-to-r from-blue-600/10 to-blue-700/10 px-4 py-2.5 pr-12 text-sm text-white placeholder-white/40 outline-none transition-all duration-300 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 animate-[slideDown_0.3s_ease-out]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/75 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

