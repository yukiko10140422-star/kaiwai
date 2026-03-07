import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          position: "relative",
        }}
      >
        {/* Border */}
        <div
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: 35,
            border: "1px solid rgba(51, 65, 85, 0.5)",
            display: "flex",
          }}
        />
        {/* Text */}
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 2,
            background: "linear-gradient(135deg, #60a5fa, #3b82f6, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          KAIWAI
        </span>
      </div>
    ),
    { ...size }
  );
}
