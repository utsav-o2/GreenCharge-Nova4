"use client";
import { useEffect, useState } from "react";
import { LogOut, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

interface HeaderProps {
  greeting?: string;
  showLogout?: boolean;
  isOperator?: boolean;
}

export default function Header({ greeting, showLogout = true, isOperator = false }: HeaderProps) {
  const router = useRouter();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!isOperator) return;

    let lastUpdatedTime = Date.now();
    
    // Reset timer when our dashboard fires a refresh event
    const handleRefresh = () => {
      lastUpdatedTime = Date.now();
      setSecondsAgo(0);
    };
    window.addEventListener("gc-data-refresh", handleRefresh);

    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("gc-data-refresh", handleRefresh);
    };
  }, [isOperator]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(10,13,11,0.9)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--color-gc-border)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-gc-accent)" }}
          >
            <Zap size={16} className="text-[#0A0D0B]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm hidden sm:block tracking-tight">
            Green<span style={{ color: "var(--color-gc-accent)" }}>Charge</span>
          </span>
        </div>

        {/* Greeting */}
        {greeting && (
          <p className="text-sm font-medium flex-1 truncate text-center sm:text-left">
            {greeting}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isOperator && (
            <div className="flex items-center gap-2 mr-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
              </div>
              <span className="text-xs font-medium text-gray-400 hidden sm:block w-36 text-right">
                Last updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
              </span>
            </div>
          )}
          {showLogout && (
            <button
              onClick={handleLogout}
              id="header-logout"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} style={{ color: "var(--color-gc-muted)" }} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
