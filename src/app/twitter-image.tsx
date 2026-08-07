import { ImageResponse } from "next/og";

export const alt = "Music Left Behind";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0d0c",
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 50% 15%, #1e1a15 0%, #0e0d0c 65%)",
        }}
      >
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            color: "#f4ede2",
            letterSpacing: -2,
          }}
        >
          Music Left Behind
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#c9a15a",
          }}
        >
          The Greatest Songs You Never Heard
        </div>
      </div>
    ),
    { ...size },
  );
}
