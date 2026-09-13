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
    const duration = 500; // faster animation for live updates
    const steps = 30;
    const diff = target - displayed;
    
    // If it's already exactly at target, or the difference is very tiny, just snap
    if (diff === 0) {
      setDisplayed(target);
      return;
    }

    const increment = diff / steps;
    let current = displayed;
    const timer = setInterval(() => {
      current += increment;
      // Check if we've crossed the target (works for both counting up and counting down)
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        setDisplayed(target);
        clearInterval(timer);
      } else {
        // Need to handle decimals if target is decimal (like 95.4)
        const isDecimal = target % 1 !== 0;
        setDisplayed(isDecimal ? Number(current.toFixed(1)) : Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, value, isNumber]); // deliberately excluding `displayed` to prevent infinite loop resetting

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
