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
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/learn" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">LMS Go</p>
              <p className="text-xs text-slate-500">{organization?.name || "Learning Platform"}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium text-slate-900">{user?.email?.split("@")[0]}</p>
                <p className="text-xs capitalize text-slate-500">{user?.role || "User"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="container-custom space-y-4 py-4">
            <div className="flex flex-col gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-blue-500/30 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-400/40 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                  <p className="text-xs capitalize text-slate-500">{user?.role || "User"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
