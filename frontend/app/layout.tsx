import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C4652A",
          colorBackground: "#1A1A1A",
          colorText: "#E8E0D0",
          colorInputBackground: "#2A2A2A",
          colorInputText: "#E8E0D0",
        },
        elements: {
          card: "bg-[#1A1A1A] border border-[#333] shadow-2xl",
          modalBackdrop: "bg-black/70 backdrop-blur-sm",
          headerTitle: "text-[#E8E0D0]",
          headerSubtitle: "text-[#E8E0D0]/60",
          socialButtonsBlockButton: "bg-[#2A2A2A] border-[#333] text-[#E8E0D0] hover:bg-[#333]",
          formFieldLabel: "text-[#E8E0D0]/80",
          formFieldInput: "bg-[#2A2A2A] border-[#444] text-[#E8E0D0]",
          formButtonPrimary: "bg-[#C4652A] hover:bg-[#a85523]",
          footerActionLink: "text-[#C4652A]",
          dividerLine: "bg-[#333]",
          dividerText: "text-[#E8E0D0]/40",
        },
      }}
    >
      <html lang="en">
        <body className="min-h-screen antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
