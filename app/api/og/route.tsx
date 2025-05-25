import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 40,
        background: "linear-gradient(to bottom, #0f172a, #1e293b)",
        color: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 20 }}>🧠</div>
      <div style={{ fontSize: 60, fontWeight: "bold", marginBottom: 10 }}>BrainCast</div>
      <div style={{ fontSize: 30, opacity: 0.8 }}>The Ultimate Quiz Experience on Farcaster</div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
