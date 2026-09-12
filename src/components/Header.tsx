"use client";
import { Bell, LogOut, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

interface HeaderProps {
  greeting?: string;
  showLogout?: boolean;
}

export default function Header({ greeting, showLogout = true }: HeaderProps) {
  const router = useRouter();

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
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors hover:bg-white/5"
            aria-label="Notifications"
          >
            <Bell size={18} style={{ color: "var(--color-gc-muted)" }} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "var(--color-gc-accent)" }}
            />
          </button>
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
