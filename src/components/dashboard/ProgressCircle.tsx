"use client";

interface ProgressCircleProps {
  /** 0〜100 の進捗率 */
  value: number;
  /** 円のサイズ (px) */
  size?: number;
  /** 線の太さ (px) */
  strokeWidth?: number;
  /** 中央に表示するラベル */
  label?: string;
  className?: string;
}

export default function ProgressCircle({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  className = "",
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* 進捗円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(clampedValue)}%</span>
        {label && <span className="text-xs text-muted mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
