"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, Menu, Settings, User2, X } from "lucide-react";
import { useMemo, useState, type ElementType } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [orgName, setOrgName] = useState(organization?.name ?? "");
  const [orgPhoto, setOrgPhoto] = useState("");

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

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      // TODO: Connect to actual API endpoints.
      console.log("Saving profile", { profileEmail, profilePassword, profilePhoto });
      if (user?.role === "admin" || user?.role === "super_admin") {
        console.log("Saving organization", { orgName, orgPhoto });
      }
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Failed to save profile", error);
    }
  };

  const initials = useMemo(() => profileEmail.substring(0, 2).toUpperCase() || "U", [profileEmail]);


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
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex h-11 items-center gap-3 rounded-full bg-[rgba(255,255,255,0.75)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--soft-shadow-sm)] transition-all hover:shadow-[var(--soft-shadow)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c1ceff] to-[#f6f9ff] text-sm font-semibold text-[var(--accent-primary)] shadow-[var(--soft-shadow-sm)]">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--foreground)]">{user?.email?.split("@")[0]}</p>
                    <p className="text-xs capitalize text-[var(--muted-foreground)]">{user?.role || "User"}</p>
                  </div>
                  <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogTitle className="text-2xl font-semibold text-[var(--foreground)]">Mon profil</DialogTitle>
                <DialogDescription className="text-[var(--muted-foreground)]">
                  Mettez à jour vos informations personnelles et d'organisation.
                </DialogDescription>
                <form className="mt-6 space-y-6" onSubmit={handleSaveProfile}>
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Informations personnelles</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--muted-foreground)]">Photo de profil (URL)</label>
                      <Input value={profilePhoto} onChange={(event) => setProfilePhoto(event.target.value)} placeholder="https://" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--muted-foreground)]">Adresse email</label>
                      <Input type="email" required value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--muted-foreground)]">Mot de passe (laisser vide pour ne pas changer)</label>
                      <Input type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} placeholder="********" />
                    </div>
                  </section>

                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <section className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Organisation</h3>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--muted-foreground)]">Nom</label>
                        <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--muted-foreground)]">Logo / Photo (URL)</label>
                        <Input value={orgPhoto} onChange={(event) => setOrgPhoto(event.target.value)} placeholder="https://" />
                      </div>
                    </section>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="secondary" onClick={() => setIsProfileOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary">
                      Enregistrer les modifications
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogout}
              className="inline-flex h-11 items-center gap-2 rounded-full px-5"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
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
