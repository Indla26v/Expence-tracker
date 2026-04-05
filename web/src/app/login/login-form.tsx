"use client";

"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
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
    <div className="w-full max-w-sm rounded-2xl border border-cyan-600/40 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl shadow-cyan-600/20 backdrop-blur-xl relative z-10 animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white flex items-center justify-center p-2 mb-4 shadow-2xl shadow-cyan-500/20 transform transition-transform hover:scale-105">
          <img src="/logo.png" alt="Expense Tracker Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent tracking-tight">
          Expense Tracker
        </h1>
        <p className="mt-2 text-sm text-cyan-400/70">Sign in to your account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-cyan-300" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-cyan-600/30 bg-gradient-to-r from-cyan-600/10 to-cyan-700/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-all duration-300 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-cyan-300" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-lg border border-cyan-600/30 bg-gradient-to-r from-cyan-600/10 to-cyan-700/10 px-4 py-2.5 pr-12 text-sm text-white placeholder-white/40 outline-none transition-all duration-300 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/60 hover:text-cyan-200 transition-colors duration-200"
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
          className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-700/75 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 active:scale-95"
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
  );
}
