"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, MapPin, Sparkles, Leaf, User, LayoutDashboard, LogOut, Zap, Building,
} from "lucide-react";
import { clearUser } from "@/lib/storage";
import { useRouter } from "next/navigation";

const driverNav = [
  { href: "/driver/home", label: "Home", icon: Home },
  { href: "/driver/stations", label: "Stations", icon: MapPin },
  { href: "/driver/recommend", label: "Recommend", icon: Sparkles },
  { href: "/driver/impact", label: "Impact", icon: Leaf },
  { href: "/driver/profile", label: "Profile", icon: User },
];

const operatorNav = [
  { href: "/operator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/operator/profile", label: "Profile", icon: User },
];

interface SidebarNavProps {
  role: "driver" | "operator";
}

export default function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === "driver" ? driverNav : operatorNav;

  function handleLogout() {
    clearUser();
    router.push("/login");
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 h-screen fixed left-0 top-0 border-r z-50"
      style={{ background: "var(--color-gc-card)", borderColor: "var(--color-gc-border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-gc-accent)" }}
        >
          <Zap size={16} className="text-[#0A0D0B]" strokeWidth={2.5} />
        </div>
        <span className="font-bold tracking-tight">
          Green<span style={{ color: "var(--color-gc-accent)" }}>Charge</span>
        </span>
      </div>

      {/* Role badge */}
      <div className="px-5 mb-4">
        <span
          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded font-semibold inline-flex items-center gap-1"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "var(--color-gc-accent)",
          }}
        >
          {role === "driver" ? (
            <><Zap size={10} fill="currentColor" /> Driver</>
          ) : (
            <><Building size={10} /> Operator</>
          )}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--color-gc-accent)" : "var(--color-gc-muted)",
                background: active ? "rgba(34,197,94,0.1)" : "transparent",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: "var(--color-gc-muted)" }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
