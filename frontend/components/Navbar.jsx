"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/",          label: "Home" },
  { href: "/movies",    label: "Movies" },
  { href: "/directors", label: "Directors" },
  { href: "/genres",    label: "Genres" },
  { href: "/global",    label: "Global Cinema" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white tracking-widest uppercase">
          Obscura
          <span className="text-[#CCFF00]">.</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === link.href
                  ? "text-[#CCFF00]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

      </div>
    </nav>
  );
}