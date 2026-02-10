import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { SocketProvider } from "@/contexts/SocketContext";

export const metadata: Metadata = {
  title: "Lost & Found - Reunite with Your Belongings",
  description:
    "A community platform to help people recover lost items and return found belongings to their owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          <Navigation />
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
