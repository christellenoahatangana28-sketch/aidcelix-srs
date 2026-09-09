import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "AIDCELIX — Find medicines nearby",
  description: "Search medications, see nearby pharmacy stock, pay in-app, and get Gozem delivery.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.svg", apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b3d2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-outfit)] text-white antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
