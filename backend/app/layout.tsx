import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPS Tracking — Admin Panel",
  description: "Field salesman GPS tracking system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
