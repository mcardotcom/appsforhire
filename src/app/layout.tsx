import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/utils/trpc-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AppsForHire",
  description: "AI Tools for Developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
