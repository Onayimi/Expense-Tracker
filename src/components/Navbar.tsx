/**
 * Navbar
 * ------
 * Top navigation bar using the brand forest green + gold palette.
 * Active route is highlighted with the gold accent colour.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Expenses", href: "/expenses" },
  { label: "Borrowed Money", href: "/borrowed" },
  { label: "Reimbursements", href: "/reimbursements" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-forest sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* App logo / title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-white font-black text-sm">
              £
            </div>
            <span className="font-bold text-white text-lg hidden sm:block tracking-tight">
              Expense Tracker
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gold text-white shadow-sm"           // Active: gold pill
                      : "text-mint-200 hover:bg-forest-400 hover:text-white" // Inactive: mint text
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Add expense CTA */}
          <Link href="/expenses/new" className="btn-primary text-xs sm:text-sm">
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Add Expense</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
