import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "食日记 · 每日饮食记录",
  description: "按日期记录每一餐的食物、份量和心情。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
