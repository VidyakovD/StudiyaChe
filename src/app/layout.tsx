import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import AiChatBot from "@/components/chat/AiChatBot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Студия ЧЕ - Обучающая платформа",
  description: "Курсы по видеопроизводству, ИИ генерации и ИИ для бизнеса",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <SessionProvider>
          {children}
          <AiChatBot />
        </SessionProvider>
      </body>
    </html>
  );
}
