import Image from "next/image";

type Size = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: Size;
  className?: string;
  /** Primary role badge to display (e.g. "リーダー", "エンジニア") */
  roleBadge?: string | null;
  /** Custom ring color class (e.g. "ring-amber-400") */
  ringColor?: string;
}

const sizeMap: Record<Size, { px: number; text: string }> = {
  xs: { px: 24, text: "text-[10px]" },
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 56, text: "text-lg" },
};

/** Well-known role → color mapping */
const roleColorMap: Record<string, string> = {
  "リーダー": "bg-amber-500",
  "leader": "bg-amber-500",
  "PM": "bg-amber-500",
  "マネージャー": "bg-amber-500",
  "エンジニア": "bg-blue-500",
  "engineer": "bg-blue-500",
  "デザイナー": "bg-purple-500",
  "designer": "bg-purple-500",
  "ディレクター": "bg-rose-500",
  "director": "bg-rose-500",
  "マーケター": "bg-emerald-500",
  "marketer": "bg-emerald-500",
  "QA": "bg-orange-500",
};

/** Well-known role → ring color mapping */
export const roleRingMap: Record<string, string> = {
  "リーダー": "ring-amber-400",
  "leader": "ring-amber-400",
  "PM": "ring-amber-400",
  "マネージャー": "ring-amber-400",
  "エンジニア": "ring-blue-400",
  "engineer": "ring-blue-400",
  "デザイナー": "ring-purple-400",
  "designer": "ring-purple-400",
  "ディレクター": "ring-rose-400",
  "director": "ring-rose-400",
  "マーケター": "ring-emerald-400",
  "marketer": "ring-emerald-400",
  "QA": "ring-orange-400",
};

function getRoleBadgeColor(role: string): string {
  const lower = role.toLowerCase();
  return roleColorMap[role] || roleColorMap[lower] || "bg-slate-500";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({ src, name, size = "md", className = "", roleBadge, ringColor }: AvatarProps) {
  const { px, text } = sizeMap[size];
  const ringClass = ringColor || "ring-background";
  const showBadge = roleBadge && (size === "md" || size === "lg");

  const avatar = src ? (
    <Image
      src={src}
      alt={name}
      width={px}
      height={px}
      className={`rounded-full object-cover ring-2 ${ringClass} ${className}`}
      style={{ width: px, height: px }}
    />
  ) : (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white font-medium ring-2 ${ringClass} ${text} ${className}`}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );

  if (!showBadge) return avatar;

  return (
    <div className="relative inline-block">
      {avatar}
      <span
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-px rounded text-[8px] font-bold text-white whitespace-nowrap leading-tight ${getRoleBadgeColor(roleBadge)}`}
        style={{ fontSize: "7px" }}
      >
        {roleBadge.length > 5 ? roleBadge.slice(0, 4) + "…" : roleBadge}
      </span>
    </div>
  );
}
