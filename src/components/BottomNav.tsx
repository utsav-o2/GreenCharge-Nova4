"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Sparkles, Leaf, User } from "lucide-react";

const driverNav = [
  { href: "/driver/home", label: "Home", icon: Home },
  { href: "/driver/stations", label: "Stations", icon: MapPin },
  { href: "/driver/recommend", label: "Recommend", icon: Sparkles },
  { href: "/driver/impact", label: "Impact", icon: Leaf },
  { href: "/driver/profile", label: "Profile", icon: User },
];

const operatorNav = [
  { href: "/operator/dashboard", label: "Dashboard", icon: Home },
  { href: "/operator/stations", label: "Stations", icon: MapPin },
  { href: "/operator/profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  role: "driver" | "operator";
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = role === "driver" ? driverNav : operatorNav;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t"
      style={{
        background: "rgba(10,13,11,0.95)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--color-gc-border)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-0"
              style={{
                color: active ? "var(--color-gc-accent)" : "var(--color-gc-muted)",
                background: active ? "rgba(34,197,94,0.1)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
