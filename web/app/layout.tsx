import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "LMS Go",
  description: "Plateforme LMS moderne inspirée de Revolut"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-[var(--background)]`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
