"use client";

import { useEffect, useState } from "react";

const links = [
  { label: "Shop", href: "#shop" },
  { label: "Collections", href: "#collections" },
  { label: "Manifesto", href: "#manifesto" },
  { label: "Contact", href: "#footer" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-10">
        <a href="#top" className="group flex items-center gap-2">
          <span className="text-devil transition-transform duration-300 group-hover:rotate-12">
            {/* devil glyph */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2c1.6 2.2 1.2 4-.3 5.2C13.8 7 16 5.7 16 3.4c2 1.6 3 4.2 3 6.6 0 4.5-3.1 8-7 8s-7-3.5-7-8c0-2.4 1-5 3-6.6 0 2.3 2.2 3.6 4.3 3.8C10.8 6 10.4 4.2 12 2Z" />
              <circle cx="9.5" cy="12.5" r="1.1" fill="#0a0a0b" />
              <circle cx="14.5" cy="12.5" r="1.1" fill="#0a0a0b" />
            </svg>
          </span>
          <span className="display text-xl tracking-tight">Sweet Devil</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="eyebrow text-ink-dim transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#shop"
          className="group relative overflow-hidden rounded-full border border-line px-5 py-2 text-sm font-medium transition-colors hover:border-devil"
        >
          <span className="relative z-10">Shop the drop</span>
          <span className="absolute inset-0 -translate-x-full bg-devil transition-transform duration-300 group-hover:translate-x-0" />
        </a>
      </nav>
    </header>
  );
}
