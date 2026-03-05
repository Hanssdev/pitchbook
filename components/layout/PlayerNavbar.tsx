"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

const NAV_ITEMS = [
  { href: "/player/search", label: "Buscar canchas" },
  { href: "/player/reservations", label: "Mis reservas" },
];

export function PlayerNavbar() {
  const pathname = usePathname();

  return (
    <header className="hidden lg:flex sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/player/search" className="font-display font-bold text-xl text-text tracking-tight">
          Pitch<span className="text-accent">Book</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-all duration-150",
                  active
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted hover:text-text hover:bg-surface-2"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <UserButton />
      </div>
    </header>
  );
}
