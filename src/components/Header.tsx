"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/therapies", label: "Therapies" },
  { href: "/behaviors", label: "Behaviors & Triggers" },
  { href: "/news", label: "Latest News" },
  { href: "/resources", label: "Resources" },
  { href: "/services", label: "Find Services" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-700">
          ASD Guide
        </Link>
        <ul className="flex flex-wrap gap-4 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-teal-700 underline underline-offset-4"
                    : "text-slate-600 hover:text-teal-700"
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
