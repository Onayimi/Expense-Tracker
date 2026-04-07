/**
 * Root Layout
 * -----------
 * Wraps every page. Sets up the global font, brand styles, and Navbar.
 */

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track personal, household, and shared expenses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Forest green top navbar */}
          <Navbar />

          {/* Main content — mint-tinted background */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-forest border-t border-forest-400 py-4 text-center text-xs text-mint-300">
            Expense Tracker — keeping your finances organised
          </footer>
        </div>
      </body>
    </html>
  );
}
