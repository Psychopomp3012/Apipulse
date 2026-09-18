"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Activity, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("apipulse_token")) {
      setIsLoggedIn(true);
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoggedIn(true);
      }
    });

    const handleOfflineEvent = () => {
      setServerOffline(true);
      setTimeout(() => setServerOffline(false), 5000); // Hide after 5 seconds
    };
    window.addEventListener("server-offline", handleOfflineEvent);

    return () => {
      unsubscribe();
      window.removeEventListener("server-offline", handleOfflineEvent);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("apipulse_token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/");
  };

  return (
    <>
      {/* Toast Notification */}
      <div 
        className={`fixed top-20 right-4 z-[60] bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-500 transform ${
          serverOffline ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <Activity className="h-5 w-5" />
        <div>
          <h4 className="font-bold text-sm">Server Offline</h4>
          <p className="text-xs text-red-100">Could not connect to the backend.</p>
        </div>
      </div>

      <nav className="fixed top-0 w-full z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <Link href="/" className="font-bold text-xl tracking-tight select-none">
              ApiPulse
            </Link>
          </div>
          <div className="flex items-center gap-6">
            {user && pathname !== "/login" ? (
              <>

                <Link href="/analytics" className="text-sm font-medium hover:text-primary transition-colors select-none flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors select-none">
                  Docs
                </Link>
              </>
            ) : (
              <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors select-none">
                Docs
              </Link>
            )}
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors select-none">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors select-none">
              Contact
            </Link>
            
            {isLoggedIn && pathname !== "/login" ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm font-medium px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all select-none cursor-pointer flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all select-none cursor-pointer flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : pathname !== "/login" ? (
              <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all select-none cursor-pointer">
                Login
              </Link>
            ) : null}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 transition-colors select-none"
            >
              {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
