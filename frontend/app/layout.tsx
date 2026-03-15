import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Bite — The real story starts where the guidebook ends",
  description:
    "A Bourdain-inspired cultural food journey generator. Name a place, discover the food.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
