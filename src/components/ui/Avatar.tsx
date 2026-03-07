import Image from "next/image";

type Size = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: Size;
  className?: string;
}

const sizeMap: Record<Size, { px: number; text: string }> = {
  xs: { px: 24, text: "text-[10px]" },
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 56, text: "text-lg" },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const { px, text } = sizeMap[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover ring-2 ring-background ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white font-medium ring-2 ring-background ${text} ${className}`}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
