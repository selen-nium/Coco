import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coco — AI Assistant for Elderly Users",
  description: "Caretaker dashboard for Coco voice AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
