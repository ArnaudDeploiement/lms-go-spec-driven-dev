"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState, type ElementType } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";

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
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container-custom">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/learn" className="flex items-center gap-3 text-foreground transition-opacity hover:opacity-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-surface shadow-subtle">
              <GraduationCap className="h-5 w-5 text-accent" strokeWidth={2.4} />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">LMS Go</p>
              <p className="text-xs text-muted-foreground">
                {organization?.name || "Learning Platform"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface px-2 py-1 shadow-subtle">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent/10 text-foreground shadow-[0_0_0_1px_var(--ring)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3 shadow-subtle">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium text-foreground">
                  {user?.email?.split("@")[0]}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user?.role || "User"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border/60 bg-background/90 backdrop-blur md:hidden">
          <div className="container-custom space-y-4 py-6">
            <div className="flex flex-col gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-ring/40 bg-accent/10 text-foreground"
                        : "border-border/70 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface px-4 py-5 shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user?.role || "User"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
