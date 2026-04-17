"use client";

"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Wallet } from "lucide-react";

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
    <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-blue-900/10 p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-[20px] relative z-10 transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.2)]">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-cyan-400 to-emerald-500 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-5">
          <div className="w-full h-full bg-black/40 backdrop-blur-sm rounded-[19px] flex items-center justify-center">
            <Wallet className="h-8 w-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Expense Tracker
        </h1>
        <p className="mt-2 text-sm font-medium tracking-tight text-white/50">Welcome back, please sign in</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wide text-white/80 uppercase" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium tracking-tight text-white placeholder-white/30 outline-none transition-all duration-300 hover:bg-black/30 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wide text-white/80 uppercase" htmlFor="password">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-12 text-sm font-medium tracking-tight text-white placeholder-white/30 outline-none transition-all duration-300 hover:bg-black/30 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
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
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-rose-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
