import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

