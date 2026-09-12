"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "driver" | "operator";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const user = getCurrentUser();
    
    if (!user) {
      router.replace("/login");
      return;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      router.replace(`/${user.role === "driver" ? "driver/home" : "operator/dashboard"}`);
      return;
    }
    
    setIsAuthorized(true);
  }, [router, requiredRole]);

  // Prevent hydration mismatch by returning a stable empty state during SSR and initial hydration.
  if (!isMounted || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
