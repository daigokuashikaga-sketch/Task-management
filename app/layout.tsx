import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Task Management",
    template: "%s | Task Management",
  },
  description:
    "Next.js（App Router）製のマルチテナント対応タスク管理アプリケーション",
  applicationName: "Task Management",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
