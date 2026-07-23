import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { SocketProvider } from "@/contexts/SocketContext";

export const metadata: Metadata = {
  title: "Lost & Found — Reunite with what matters",
  description:
    "A calm community platform to report lost items, share found belongings, and help people reconnect.",
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
          <main>{children}</main>
        </SocketProvider>
      </body>
    </html>
  );
}
