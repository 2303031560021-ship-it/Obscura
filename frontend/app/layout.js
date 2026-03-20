import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Obscura — Global Cinema Analytics",
  description: "Data analytics platform for global cinema",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}