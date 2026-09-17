"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Utensils,
  Sparkles,
  CheckCircle2,
} from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""
  const paramError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(paramError || "")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPass,
        redirect: false,
      })

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Invalid email address or password.")
        } else {
          setError(res.error)
        }
      } else {
        if (callbackUrl && callbackUrl !== "/") {
          router.push(callbackUrl)
        } else if (loginEmail.includes("admin")) {
          router.push("/dashboard/admin")
        } else if (loginEmail.includes("owner")) {
          router.push("/dashboard/restaurant")
        } else {
          router.push("/dashboard/restaurant")
        }
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred during sign in.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(email, password)
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6" dir="ltr">
      {/* Mobile Brand Header */}
      <div className="lg:hidden text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
          <Utensils className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          RIVIX
        </h1>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
          Operations Platform
        </p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-3xl bg-[#0B192C]/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-2xl space-y-6 text-slate-100 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Form Header */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AUTHENTICATION</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white pt-1">
            Welcome Back 👋
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your email and password to access your restaurant portal.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300 font-semibold flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Buttons */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-bold text-slate-400 block tracking-wide uppercase font-mono">
            One-Click Demo Sign In:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("owner@rivix.com")
                setPassword("password123")
                handleLogin("owner@rivix.com", "password123")
              }}
              className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800 text-cyan-400 font-bold text-[11px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              <Store className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="truncate w-full text-center">Owner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("staff@rivix.com")
                setPassword("password123")
                handleLogin("staff@rivix.com", "password123")
              }}
              className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-800 text-emerald-400 font-bold text-[11px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="truncate w-full text-center">Manager</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("rivix@admin.com")
                setPassword("password123")
                handleLogin("rivix@admin.com", "password123")
              }}
              className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-purple-500/50 hover:bg-slate-800 text-purple-400 font-bold text-[11px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="truncate w-full text-center">Admin</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0B192C] px-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 font-mono">
            Or Sign In Manually
          </span>
        </div>

        {/* Manual Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full mt-3 text-xs font-bold py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 cursor-pointer uppercase tracking-wider"
          >
            {loading ? "Signing In..." : "Sign In to Dashboard →"}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <Link
            href="/"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/register-restaurant" className="font-bold text-cyan-400 hover:underline">
              Register Restaurant
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/register" className="font-bold text-cyan-400 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950" dir="ltr">
      {/* Form Section */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-12 bg-slate-950 relative">
        <Suspense
          fallback={
            <div className="text-center text-slate-400 text-xs font-mono">
              Loading authentication interface...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Decorative Branding Side Banner */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0B192C] via-slate-900 to-[#102A45] relative overflow-hidden border-l border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              RIVIX
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Operations Platform
            </p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-cyan-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Next-Gen Restaurant Platform</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Complete Control Over Your Operations
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            All-in-one unified dashboard designed for real-time order processing, kitchen dispatch,
            staff management, and multi-branch analytics with instant live synchronization.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
            <div className="space-y-1">
              <div className="text-2xl font-black text-cyan-400 font-mono">99.9%</div>
              <div className="text-[11px] text-slate-400 font-medium">System Uptime</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-emerald-400 font-mono">⚡ Instant</div>
              <div className="text-[11px] text-slate-400 font-medium">Real-Time Sync</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-white font-mono">24/7</div>
              <div className="text-[11px] text-slate-400 font-medium">Live Monitoring</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 font-mono">
          © {new Date().getFullYear()} RIVIX Platform. All rights reserved.
        </div>
      </div>
    </div>
  )
}
