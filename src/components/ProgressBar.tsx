"use client";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  height?: string;
  animated?: boolean;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  color = "var(--color-gc-accent)",
  height = "8px",
  animated = true,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="w-full flex flex-col gap-1">
      {showLabel && (
        <div className="flex justify-between text-xs" style={{ color: "var(--color-gc-muted)" }}>
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height,
          background: "rgba(255,255,255,0.07)",
        }}
      >
        <div
          className={animated ? "animate-fill-bar" : ""}
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "inherit",
            transition: animated ? undefined : "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}
