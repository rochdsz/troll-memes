"use client";

import { Suspense } from 'react';
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get("signup") === "success";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-slate-900 p-8 border border-slate-800 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your Troll Memes account</p>
        </div>

        {justSignedUp && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
            Account created successfully! Please log in.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// This is the corrected wrapper that Next.js requires
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}