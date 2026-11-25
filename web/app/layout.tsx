import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({ subsets: ["latin"], adjustFontFallback: false });

export const metadata: Metadata = {
  title: "Quad — UCLA Clubs",
  description: "Browse UCLA student clubs by major, interest, and schedule.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${googleSans.className} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
