import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";


const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "My Reading Log",
  description: "Your personal reading companion",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${lato.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Fixed Background */}
        <div
          className="fixed inset-0 z-[-1]"
          style={{
            backgroundImage: "url('/background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Overlay for better readability */}
        <div className="fixed inset-0 z-[-1] bg-black/50" />

        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

      </body>
    </html>
  );
}
