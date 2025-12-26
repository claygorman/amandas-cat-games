import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cat Stack",
  description: "A physics-based cat stacking game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
