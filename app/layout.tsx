import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./app.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Code Names AI",
  description: "Codenames AI is an innovative web application that generates and displays customizable boards for the popular board game Codenames. Our unique approach sets us apart from other online Codenames apps by allowing users to input five categories, which are then used to construct the game board with relevant words.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
