"use client";
import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  delay?: number;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  icon,
  accent = false,
  delay = 0,
  subtitle,
}: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const isNumber = typeof value === "number";
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !isNumber) return;
    const target = value as number;
    const duration = 800;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayed(target);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, value, isNumber]);

  return (
    <div
      ref={ref}
      className="card animate-fade-slide-up flex flex-col gap-2"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs uppercase tracking-widest font-medium"
          style={{ color: "var(--color-gc-muted)" }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: accent ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)" }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: accent ? "var(--color-gc-accent)" : "var(--color-gc-text)" }}
        >
          {isNumber && visible ? displayed : value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: "var(--color-gc-muted)" }}>
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs" style={{ color: "var(--color-gc-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
