"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    } else if (user.role === "driver") {
      router.replace("/driver/home");
    } else {
      router.replace("/operator/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-gc-accent)", borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: "var(--color-gc-muted)" }}>Loading GreenCharge…</p>
      </div>
    </div>
  );
}
