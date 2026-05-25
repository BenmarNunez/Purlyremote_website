"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const navLinks = [
  { href: "/#about", label: "About Us" },
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#why-us", label: "Why Choose Us" },
  { href: "/#contact", label: "Contact" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-border"
          : "bg-transparent"
      )}
    >
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative w-[140px] h-9 sm:w-[170px]">
              <Image
                src="/logo.jpeg"
                alt="Purly Remote LLC"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-ghost text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
              Log In
            </Link>
            <Link href="/apply" className="btn-outline text-sm py-2 px-5">
              Apply as Freelancer
            </Link>
            <Link href="/hire" className="btn-primary text-sm py-2 px-5">
              Hire Talent
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-btn text-neutral-text hover:bg-neutral-bg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-border shadow-lg">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 px-3 text-neutral-text font-medium hover:text-brand-blue hover:bg-brand-blue-light rounded-btn transition-colors text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-neutral-border">
              <Link
                href="/auth/login"
                className="btn-ghost text-sm py-2.5 w-full text-center"
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/apply"
                className="btn-outline text-sm py-2.5 w-full text-center"
                onClick={() => setMobileOpen(false)}
              >
                Apply as Freelancer
              </Link>
              <Link
                href="/hire"
                className="btn-primary text-sm py-2.5 w-full text-center"
                onClick={() => setMobileOpen(false)}
              >
                Hire Talent
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
