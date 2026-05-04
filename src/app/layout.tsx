import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MFXAI Chat - Multi-Model AI Assistant",
  description: "Advanced AI Chatbot with Multi-Model Support including GPT-4o, Claude, Gemini, Llama, Mistral, and Image Generation capabilities.",
  keywords: ["AI Chat", "GPT-4", "Claude", "Gemini", "Llama", "Mistral", "DALL-E", "Image Generation", "Multi-Model"],
  authors: [{ name: "MFXAI Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MFXAI Chat",
    description: "Multi-Model AI Assistant with Chat and Image Generation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
