"use client";

interface ScoreBadgeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
}

function getColor(score: number) {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

export default function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const color = getColor(score);
  const sizes = {
    sm: { r: 18, sw: 3, fontSize: "text-sm", dim: "w-12 h-12" },
    md: { r: 28, sw: 4, fontSize: "text-xl", dim: "w-20 h-20" },
    lg: { r: 44, sw: 6, fontSize: "text-4xl", dim: "w-32 h-32" },
  };
  const { r, sw, fontSize, dim } = sizes[size];
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const svgSize = (r + sw + 4) * 2;

  return (
    <div className={`${dim} relative flex items-center justify-center`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute inset-0 w-full h-full -rotate-90"
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={sw}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className={`${fontSize} font-bold relative z-10`} style={{ color }}>
        {score}
      </span>
    </div>
  );
}
