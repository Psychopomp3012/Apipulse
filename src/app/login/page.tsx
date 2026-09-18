"use client";

import { useState, useEffect } from "react";
import { Mail, AlertCircle } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const DISPOSABLE_EMAIL_REGEX = /@(10minutemail|mailinator|guerrillamail|yopmail|tempmail|sharklasers|dispostable|throwawaymail)\.com$/i;

  useEffect(() => {
    // If they already have the backend token, send them straight to dashboard
    if (localStorage.getItem("apipulse_token")) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (DISPOSABLE_EMAIL_REGEX.test(email)) {
      setError("Disposable emails are not allowed.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const backendRes = await fetch("http://localhost:8080/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIdToken: idToken })
      });

      if (!backendRes.ok) {
        throw new Error("Backend authentication failed. Ensure Spring Boot is running.");
      }

      const data = await backendRes.json();
      localStorage.setItem("apipulse_token", data.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("fetch") || err.message.includes("Network")) {
        window.dispatchEvent(new Event("server-offline"));
      }
      setError(err.message || "Failed to log in with email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      // Clear any stuck broken state from previous redirect attempts
      try { await auth.signOut(); } catch (e) {}

      googleProvider.setCustomParameters({ prompt: "select_account" });
      
      // We MUST use signInWithPopup on localhost. signInWithRedirect is blocked by Chrome's third-party storage partitioning.
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result && result.user) {
        const idToken = await result.user.getIdToken();
        const backendRes = await fetch("http://localhost:8080/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleIdToken: idToken })
        });
        
        if (!backendRes.ok) {
          throw new Error("Backend authentication failed. Ensure Spring Boot is running.");
        }
        
        const data = await backendRes.json();
        localStorage.setItem("apipulse_token", data.token);
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.warn("Google login caught error:", err);
      if (err.message.includes("fetch") || err.message.includes("Network")) {
        window.dispatchEvent(new Event("server-offline"));
      }
      setError(err.message || "Failed to trigger Google login.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6">
            <AlertCircle className="h-5 shrink-0 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}


        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-gray-500 select-none">Or continue with email</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 glass hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-medium transition-all select-none cursor-pointer disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 select-none">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => {setEmail(e.target.value); setError("");}}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="you@company.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 select-none">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-all select-none cursor-pointer">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
