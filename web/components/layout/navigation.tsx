"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState, type ElementType } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/learn",
    label: "Formations",
    icon: GraduationCap,
  },
  {
    href: "/admin",
    label: "Admin",
    icon: LayoutDashboard,
    adminOnly: true,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, organization } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "admin" || user?.role === "super_admin";
    }
    return true;
  });

  const handleLogout = async () => {
    await apiClient.logout();
    window.location.href = "/auth";
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <div className="container-custom pt-4">
        <div className="neo-nav-shell flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/learn" className="flex items-center gap-3 text-[var(--foreground)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ea4ff] to-[#6dd5fa] text-white shadow-[var(--soft-shadow-sm)]">
              <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{organization?.name || "LMS Go"}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Plateforme d'apprentissage</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="neo-pill-group">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "neo-pill-item",
                      isActive && "neo-pill-item-active bg-gradient-to-r from-[#b99bff] via-[#a8bcff] to-[#8ad9ff] text-white shadow-[var(--soft-shadow-sm)]"
                    )}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[rgba(46,41,72,0.55)]"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

  {/* User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="neo-surface text-sm leading-tight px-4 py-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c1ceff] to-[#f6f9ff] text-sm font-semibold text-[var(--accent-primary)] shadow-[var(--soft-shadow-sm)]">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">{user?.email?.split("@")[0]}</p>
                <p className="text-xs capitalize text-[var(--muted-foreground)]">{user?.role || "User"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#bfa0ff] to-[#87d6ff] px-4 py-2 text-sm font-semibold text-white shadow-[var(--soft-shadow-sm)] transition-all duration-200 hover:shadow-[var(--soft-shadow)] active:shadow-[var(--soft-shadow-inset)]"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#c9afff] to-[#8ddaff] text-white shadow-[var(--soft-shadow-sm)] transition-all duration-200 hover:shadow-[var(--soft-shadow)] md:hidden"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="container-custom pb-4 pt-3">
            <div className="neo-surface neo-surface-hover space-y-4 p-4">
              <div className="flex flex-col gap-2">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "neo-tile flex items-center gap-3 px-4 py-3 text-sm font-medium",
                        isActive && "text-[var(--accent-primary)]"
                      )}
                    >
                    <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[rgba(46,41,72,0.55)]"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="neo-surface-inset rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c1ceff] to-[#f6f9ff] text-sm font-semibold text-[var(--accent-primary)] shadow-[var(--soft-shadow-sm)]">
                    {user?.email?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{user?.email}</p>
                    <p className="text-xs capitalize text-[var(--muted-foreground)]">{user?.role || "User"}</p>
                  </div>
                </div>
              <button
                onClick={handleLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#bfa0ff] to-[#87d6ff] px-4 py-2 text-sm font-semibold text-white shadow-[var(--soft-shadow-sm)] transition-all duration-200 hover:shadow-[var(--soft-shadow)]"
              >
                <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
