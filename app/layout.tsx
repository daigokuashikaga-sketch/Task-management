import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Management",
  description: "Next.js 製のフルスタック・タスク管理アプリケーション",
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
