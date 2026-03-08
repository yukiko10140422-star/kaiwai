"use client";

interface ProgressBarProps {
  /** 0〜100 の進捗率 */
  value: number;
  /** バーの高さ */
  height?: number;
  /** ラベル（左側） */
  label?: string;
  /** 数値を表示するか */
  showValue?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  height = 8,
  label,
  showValue = true,
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <span className="text-sm text-muted">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full bg-border/50 overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            background: "linear-gradient(90deg, var(--accent), var(--color-status-done))",
            width: `${clampedValue}%`,
          }}
        />
      </div>
    </div>
  );
}
