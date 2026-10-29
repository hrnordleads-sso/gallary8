import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { BrainPrefetch } from "@/components/BrainPrefetch";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Neural Monitor | Immersive Brain Field",
  description:
    "A cinematic scroll-driven 3D neural field — point-cloud cerebrum, starlit void, and synchronized storytelling.",
  // Prefer public/favicon.ico so static export + GitHub Pages resolve under basePath
  icons: {
    icon: [{ url: `${basePath}/favicon.ico`, type: "image/x-icon" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} overflow-x-hidden antialiased`}
      >
        <BrainPrefetch />
        {children}
      </body>
    </html>
  );
}
