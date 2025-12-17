import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for the pill design
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Services", href: "#services" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-none">
      <div
        className={`
        mx-auto mt-4 transition-all duration-300 pointer-events-auto
        ${
          scrolled
            ? "max-w-5xl px-4 py-2 bg-background/70 backdrop-blur-xl border shadow-lg rounded-full"
            : "max-w-7xl px-6 py-4 bg-transparent border-transparent"
        }
      `}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">DarNumber</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="lg"
              className=""
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Log in
            </Button>
            <Button
              size="lg"
              className=" px-5"
              variant="default"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 bg-background border rounded-full shadow-sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col pointer-events-auto animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center p-6 border-b">
            <span className="text-xl font-bold">DarNumber</span>
            <button
              className="p-2 hover:bg-muted rounded-full transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-8 text-center p-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-3xl font-semibold hover:text-primary transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}

            <div className="w-full pt-8 flex flex-col gap-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-2xl h-14 text-lg"
              >
                Log in
              </Button>
              <Button size="lg" className="w-full rounded-2xl h-14 text-lg">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
