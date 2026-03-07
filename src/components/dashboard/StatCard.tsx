"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  /** カードの左ボーダーカラー */
  accentColor?: string;
  subtitle?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  accentColor = "var(--accent)",
  subtitle,
  className = "",
}: StatCardProps) {
  return (
    <motion.div
      className={`glass rounded-2xl p-5 border-l-4 ${className}`}
      style={{ borderLeftColor: accentColor }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-muted text-2xl">{icon}</div>
      </div>
    </motion.div>
  );
}
