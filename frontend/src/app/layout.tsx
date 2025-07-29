import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "Component Generator - AI-Powered React Component Builder",
  description:
    "Generate, customize, and export React components using AI. Build beautiful UIs with conversational prompts.",
  keywords:
    "react, component, generator, ai, frontend, ui, javascript, typescript",
  authors: [{ name: "Component Generator Team" }],
  openGraph: {
    type: "website",
    title: "Component Generator",
    description: "AI-Powered React Component Builder",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Component Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Component Generator",
    description: "AI-Powered React Component Builder",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <div id="root">{children}</div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 5000,
                  style: {},
                  className: "",
                  success: { style: {} },
                  error: { style: {} },
                }}
                reverseOrder={false}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
