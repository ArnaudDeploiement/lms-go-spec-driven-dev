"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
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
    <nav className="glass-nav fixed top-6 left-6 right-6 z-50 rounded-3xl">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/learn" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                LMS Go
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">
                {organization?.name || "Learning Platform"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-white/15 text-[var(--text-primary)] shadow-lg"
                        : "text-[var(--text-secondary)] hover:bg-white/8 hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* User Avatar */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-[var(--text-primary)] leading-none">
                  {user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] capitalize mt-0.5">
                  {user?.role || "User"}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn-ghost btn-sm"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden btn-ghost btn-sm"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-slide-in">
            <div className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? "bg-white/15 text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-white/8 hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="divider my-4" />

              {/* User Info Mobile */}
              <div className="px-4 py-3 rounded-2xl bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white">
                    {user?.email?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)] text-sm">
                      {user?.email}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] capitalize">
                      {user?.role || "User"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn-danger btn-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
