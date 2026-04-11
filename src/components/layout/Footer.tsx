import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, Linkedin, Twitter, Facebook } from "lucide-react";

const footerLinks = {
  Company: [
    { href: "/#about", label: "About Us" },
    { href: "/#services", label: "Services" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#why-us", label: "Why Choose Us" },
    { href: "/#contact", label: "Contact" },
  ],
  "For Talent": [
    { href: "/apply", label: "Apply as Freelancer" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#services", label: "Freelancer Benefits" },
  ],
  "For Clients": [
    { href: "/hire", label: "Hire Talent" },
    { href: "/#services", label: "Client Solutions" },
    { href: "/#why-us", label: "Why Purly Remote" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-text text-white">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="relative w-[210px] h-[58px] mb-4">
              <Image
                src="/logo.jpeg"
                alt="Purly Remote LLC"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs mb-6">
              Connecting skilled freelancers with international clients —
              enabling fully remote, work-from-home opportunities worldwide.
            </p>
            <a
              href="mailto:hello@purlyremote.com"
              className="flex items-center gap-2 text-white/70 hover:text-brand-blue transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              hello@purlyremote.com
            </a>
            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Linkedin, label: "LinkedIn", href: "#" },
                { Icon: Twitter, label: "Twitter", href: "#" },
                { Icon: Facebook, label: "Facebook", href: "#" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-blue transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span>© {year} Purly Remote LLC. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Empowering global remote talent
          </span>
        </div>
      </div>
    </footer>
  );
}
