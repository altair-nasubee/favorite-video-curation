import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ciné — Favorite Video Curation",
  description: "お気に入りの YouTube 動画を集め、再生するプライベート試写室。",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0a08",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${fraunces.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
