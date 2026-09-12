"use client";
import { useEffect, useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuthGuard from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { getGreeting } from "@/lib/storage";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setGreeting(getGreeting(user.name));
    }
  }, []);

  return (
    <AuthGuard requiredRole="operator">
      <div className="h-screen flex overflow-hidden">
        <SidebarNav role="operator" />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto lg:pl-60">
          <Header greeting={greeting} />
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
          <BottomNav role="operator" />
        </div>
      </div>
    </AuthGuard>
  );
}
